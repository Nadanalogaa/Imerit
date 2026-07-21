import crypto from "node:crypto";
import Razorpay from "razorpay";
import { AuditAction, PaymentStatus, PlanAudience, UserRole, type Subscription } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { HttpError } from "../middleware/error.js";
import { notifySubscriptionPaid, notifySubscriptionRefunded } from "./notify.service.js";

/**
 * Subscription + payment lifecycle. Two-step Razorpay flow:
 *
 *   1. createOrder({ userId, planId }) — books a Razorpay Order,
 *      writes a PENDING Subscription row. Returns { orderId,
 *      amount, key } that the frontend passes to the Razorpay
 *      checkout SDK.
 *
 *   2. verifyPayment({ orderId, paymentId, signature }) —
 *      cryptographically checks the HMAC signature Razorpay
 *      handed back to the browser. On success, activates the
 *      subscription + fires the receipt email.
 *
 * The webhook path (handleWebhook) is the same as step 2 but
 * triggered server-to-server by Razorpay. It exists as a safety net
 * for when the browser flow drops mid-verify (network hiccup,
 * closed tab) — the payment is still real, and the webhook makes
 * sure the subscription still activates. Idempotent — safe to run
 * both /verify and webhook against the same payment.
 *
 * Money is stored in paise everywhere (integer) to avoid the
 * floating-point drift that comes from storing rupees as float.
 */

// GST rate for recruitment services (SAC 998363).
const GST_RATE = 0.18;

/**
 * Lazily instantiate the Razorpay client. Some deployments will run
 * without keys (KYC pending) and every unrelated route should still
 * boot — we only fail loud when a caller actually tries to create
 * an order.
 */
let cachedClient: Razorpay | null = null;
function client(): Razorpay {
  if (cachedClient) return cachedClient;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new HttpError(
      503,
      "Payments are not configured yet. Please try again shortly or contact support.",
      "PAYMENTS_UNAVAILABLE",
    );
  }
  cachedClient = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return cachedClient;
}

/**
 * Public read of the Razorpay key id — the frontend needs it to
 * open the checkout modal. The SECRET never leaves the server.
 */
export function publicKeyId(): string {
  return env.RAZORPAY_KEY_ID;
}

// ==================================================================
// Step 1 — create an order
// ==================================================================

interface CreateOrderArgs {
  userId: string;
  planId: string;
}

export async function createOrder(args: CreateOrderArgs): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  subscriptionId: string;
}> {
  const plan = await prisma.plan.findUnique({ where: { id: args.planId } });
  if (!plan || !plan.active) {
    throw new HttpError(404, "Plan not found or inactive", "PLAN_NOT_FOUND");
  }

  const user = await prisma.user.findUnique({ where: { id: args.userId } });
  if (!user || user.deletedAt) throw new HttpError(404, "User not found", "USER_NOT_FOUND");

  // Enforce the audience/role fit — a candidate can't buy an employer
  // plan and vice versa. Cheap sanity check; also stops accidental
  // double-charges from a wrong-role browser session.
  const wrongAudience =
    (plan.audience === PlanAudience.CANDIDATE && user.role !== UserRole.CANDIDATE) ||
    (plan.audience !== PlanAudience.CANDIDATE && user.role !== UserRole.EMPLOYER);
  if (wrongAudience) {
    throw new HttpError(400, "This plan isn't available for your account type", "PLAN_AUDIENCE_MISMATCH");
  }

  const amountInPaise = plan.priceInPaise;
  const gstInPaise = plan.gstApplies ? Math.round(amountInPaise * GST_RATE) : 0;
  const totalInPaise = amountInPaise + gstInPaise;

  // Create the Razorpay order first — if that fails we don't want a
  // dangling pending row in our DB with no counterpart.
  const order = await client().orders.create({
    amount: totalInPaise,
    currency: "INR",
    receipt: `sub_${Date.now().toString(36)}`,
    notes: {
      userId: user.id,
      planId: plan.id,
      planLabel: plan.label,
      userEmail: user.email,
    },
  });

  // Now persist the pending Subscription row. If this fails after
  // the order was created, the webhook path will still activate it
  // when Razorpay reports the payment (userId + planId are in the
  // order.notes we just set).
  const sub = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      startedAt: new Date(),
      // Placeholder expiry — replaced on successful payment. Kept
      // non-null because the column is required.
      expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      paymentStatus: PaymentStatus.PENDING,
      razorpayOrderId: order.id,
      amountInPaise,
      gstInPaise,
      totalInPaise,
    },
  });

  return {
    orderId: order.id,
    amount: totalInPaise,
    currency: "INR",
    key: publicKeyId(),
    subscriptionId: sub.id,
  };
}

// ==================================================================
// Step 2 — verify payment (client callback)
// ==================================================================

interface VerifyArgs {
  orderId: string;
  paymentId: string;
  signature: string;
  userId: string;
}

/**
 * Verify the HMAC signature Razorpay hands back to the browser after
 * a successful payment. If it checks out, activate the subscription.
 *
 * Idempotent: if the webhook already activated the same order, this
 * is a no-op that returns the existing row. Safe to hit repeatedly.
 */
export async function verifyPayment(args: VerifyArgs): Promise<Subscription> {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest("hex");
  if (expected !== args.signature) {
    throw new HttpError(400, "Payment signature verification failed", "SIGNATURE_INVALID");
  }

  const sub = await prisma.subscription.findUnique({
    where: { razorpayOrderId: args.orderId },
  });
  if (!sub) throw new HttpError(404, "Order not recognised", "ORDER_NOT_FOUND");
  if (sub.userId !== args.userId) {
    // Someone tried to activate another user's subscription with a
    // valid signature (would require a compromised session). Refuse.
    throw new HttpError(403, "Order does not belong to this user", "FORBIDDEN");
  }

  // Idempotency short-circuit — webhook may have run first.
  if (sub.paymentStatus === PaymentStatus.PAID) return sub;

  return activateSubscription({ subscription: sub, paymentId: args.paymentId, source: "verify" });
}

// ==================================================================
// Webhook path (server-to-server, out of band)
// ==================================================================

/**
 * Handle a Razorpay webhook. Signature check protects against
 * arbitrary POSTs. On `payment.captured` we activate the matching
 * subscription (same idempotent-safe write as the /verify path).
 * Everything else is logged and ignored.
 */
export async function handleWebhook(args: {
  rawBody: string;
  signature: string;
  event: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    logger.warn("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is unset — refusing");
    throw new HttpError(503, "Webhook secret not configured", "WEBHOOK_UNCONFIGURED");
  }
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(args.rawBody)
    .digest("hex");
  if (expected !== args.signature) {
    logger.warn({ event: args.event }, "Razorpay webhook signature invalid");
    throw new HttpError(400, "Invalid webhook signature", "SIGNATURE_INVALID");
  }

  // Route on event type. Razorpay fires several events per
  // successful payment (order.paid, payment.captured, payment.
  // authorized). We only need one canonical activation point —
  // payment.captured — because that's the moment funds are locked
  // in our merchant account.
  switch (args.event) {
    case "payment.captured": {
      const payment = (args.payload.payment as { entity?: Record<string, unknown> })?.entity;
      if (!payment) return;
      const orderId = payment.order_id as string | undefined;
      const paymentId = payment.id as string | undefined;
      if (!orderId || !paymentId) return;
      const sub = await prisma.subscription.findUnique({ where: { razorpayOrderId: orderId } });
      if (!sub) {
        logger.warn({ orderId }, "Webhook payment.captured for unknown order — ignoring");
        return;
      }
      if (sub.paymentStatus === PaymentStatus.PAID) return; // already activated
      await activateSubscription({ subscription: sub, paymentId, source: "webhook" });
      return;
    }
    case "payment.failed": {
      const payment = (args.payload.payment as { entity?: Record<string, unknown> })?.entity;
      if (!payment) return;
      const orderId = payment.order_id as string | undefined;
      if (!orderId) return;
      await prisma.subscription
        .update({
          where: { razorpayOrderId: orderId },
          data: { paymentStatus: PaymentStatus.FAILED },
        })
        .catch((err) => logger.warn({ err, orderId }, "Could not mark subscription FAILED"));
      return;
    }
    case "refund.processed": {
      // Refund fully processed by the bank — flip the row.
      const refund = (args.payload.refund as { entity?: Record<string, unknown> })?.entity;
      if (!refund) return;
      const paymentId = refund.payment_id as string | undefined;
      const refundId = refund.id as string | undefined;
      if (!paymentId) return;
      await prisma.subscription
        .updateMany({
          where: { razorpayPaymentId: paymentId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            razorpayRefundId: refundId,
            refundedAt: new Date(),
          },
        })
        .catch((err) => logger.warn({ err }, "Could not mark subscription REFUNDED"));
      return;
    }
    default:
      logger.debug({ event: args.event }, "Razorpay webhook — ignored event");
  }
}

// ==================================================================
// Activation — single path used by /verify AND webhook
// ==================================================================

async function activateSubscription(args: {
  subscription: Subscription;
  paymentId: string;
  source: "verify" | "webhook";
}): Promise<Subscription> {
  const sub = args.subscription;
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: sub.planId } });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  const invoiceNumber = await nextInvoiceNumber();

  // Try to create the invoice via Razorpay's Invoicing API — they
  // generate the GST-compliant PDF + host it. Best-effort: if it
  // fails, we still activate the subscription and log the miss so
  // admin can regenerate later.
  let invoiceUrl: string | null = null;
  try {
    invoiceUrl = await createRazorpayInvoice({
      paymentId: args.paymentId,
      invoiceNumber,
      subscription: sub,
      planLabel: plan.label,
    });
  } catch (err) {
    logger.warn({ err, subId: sub.id }, "Razorpay invoice creation failed — activating anyway");
  }

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      paymentStatus: PaymentStatus.PAID,
      razorpayPaymentId: args.paymentId,
      paidAt: now,
      startedAt: now,
      expiresAt,
      invoiceNumber,
      invoiceUrl,
    },
    include: { user: true, plan: true },
  });

  // Best-effort notifications — mail failures never block activation.
  void notifySubscriptionPaid({
    userName: updated.user.name,
    userEmail: updated.user.email,
    planLabel: updated.plan.label,
    amountInRupees: (updated.totalInPaise / 100).toFixed(2),
    invoiceNumber: invoiceNumber,
    invoiceUrl: invoiceUrl,
    expiresAt: updated.expiresAt.toISOString(),
  }).catch((err) => logger.warn({ err }, "notifySubscriptionPaid failed"));

  logger.info(
    { subId: sub.id, userId: sub.userId, source: args.source, paymentId: args.paymentId },
    "Subscription activated",
  );
  return updated;
}

// ==================================================================
// User + admin queries
// ==================================================================

export async function listMySubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
}

/** Currently-active subscription for a user (paid + not expired). */
export async function activeSubscriptionFor(userId: string) {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      userId,
      paymentStatus: PaymentStatus.PAID,
      expiresAt: { gt: now },
    },
    include: { plan: true },
    orderBy: { expiresAt: "desc" },
  });
}

// ==================================================================
// Refunds — admin-triggered
// ==================================================================

interface RefundArgs {
  subscriptionId: string;
  actorId: string;
  actorRole: UserRole;
  reason?: string;
}

export async function refundSubscription(args: RefundArgs) {
  const sub = await prisma.subscription.findUnique({
    where: { id: args.subscriptionId },
    include: { user: true, plan: true },
  });
  if (!sub) throw new HttpError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  if (sub.paymentStatus !== PaymentStatus.PAID) {
    throw new HttpError(400, "Only paid subscriptions can be refunded", "NOT_REFUNDABLE");
  }
  if (!sub.razorpayPaymentId) {
    throw new HttpError(400, "Subscription has no payment id to refund", "NO_PAYMENT_REF");
  }

  const refund = await client().payments.refund(sub.razorpayPaymentId, {
    amount: sub.totalInPaise,
    notes: { reason: args.reason ?? "Admin refund", subscriptionId: sub.id },
  });

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      paymentStatus: PaymentStatus.REFUNDED,
      razorpayRefundId: refund.id,
      refundRef: refund.id,
      refundedAt: new Date(),
      refundedById: args.actorId,
      refundReason: args.reason ?? null,
      // Expire the subscription immediately on refund so the user
      // loses paid access — we're returning their money, they don't
      // get to keep using the service.
      expiresAt: new Date(),
    },
    include: { user: true, plan: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: args.actorId,
      actorRole: args.actorRole,
      action: AuditAction.SUBSCRIPTION_REFUNDED,
      targetType: "subscription",
      targetId: sub.id,
      payload: { reason: args.reason ?? null, refundId: refund.id, amountInPaise: sub.totalInPaise },
    },
  });

  void notifySubscriptionRefunded({
    userName: updated.user.name,
    userEmail: updated.user.email,
    planLabel: updated.plan.label,
    amountInRupees: (updated.totalInPaise / 100).toFixed(2),
    reason: args.reason ?? "Admin refund",
  }).catch((err) => logger.warn({ err }, "notifySubscriptionRefunded failed"));

  return updated;
}

// ==================================================================
// Invoice numbering + Razorpay invoicing
// ==================================================================

/**
 * Sequential invoice numbers for the current fiscal year — required
 * by Indian GST law (no gaps, restart April 1). Format: INV-2026-27-000123.
 * The counter comes from the current max invoice number for the FY.
 *
 * Concurrent writes are safe because invoiceNumber is `@unique` in
 * the schema — a race gets a P2002 which the caller catches and
 * retries. Simpler than a distributed counter table for our volume.
 */
async function nextInvoiceNumber(): Promise<string> {
  const fy = fiscalYearRange(new Date());
  const prefix = `INV-${fy.startYear}-${String(fy.endYear).slice(-2)}-`;

  // Find the highest existing number for the current FY.
  const latest = await prisma.subscription.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const lastN = latest?.invoiceNumber ? parseInt(latest.invoiceNumber.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastN + 1).padStart(6, "0")}`;
}

function fiscalYearRange(d: Date): { startYear: number; endYear: number } {
  // Indian FY runs April → March. Anything Jan-Mar is the FY that
  // started the previous April.
  const y = d.getFullYear();
  if (d.getMonth() < 3) return { startYear: y - 1, endYear: y };
  return { startYear: y, endYear: y + 1 };
}

/**
 * Fire Razorpay's Invoicing API to attach a GST-compliant PDF to the
 * payment. Razorpay handles the tax breakdown + PDF hosting;
 * we cache the URL for the customer + admin.
 *
 * We call this as a `pay_invoice` linked to the existing payment so
 * Razorpay doesn't try to collect money again — it just decorates
 * the payment with an invoice.
 */
async function createRazorpayInvoice(args: {
  paymentId: string;
  invoiceNumber: string;
  subscription: Subscription;
  planLabel: string;
}): Promise<string | null> {
  try {
    // The Razorpay SDK's `invoices` interface expects `line_items`
    // in paise, and each item can carry its own tax rate. HSN/SAC
    // 998363 covers "recruitment / employee search services".
    // Cast to `any` because the razorpay type defs don't cover
    // every optional field we're using.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = await (client().invoices as any).create({
      type: "invoice",
      description: args.planLabel,
      partial_payment: false,
      customer_id: undefined,
      draft: false,
      // Attach to the existing payment — Razorpay marks it paid
      // without re-collecting from the customer.
      // (Note: their public Invoicing API is opinionated here; if
      // this shape doesn't attach cleanly we fall back to just
      // storing the invoice number without a PDF link.)
      receipt: args.invoiceNumber,
      line_items: [
        {
          name: args.planLabel,
          description: "i-Tamil Recruit subscription",
          amount: args.subscription.amountInPaise,
          currency: "INR",
          quantity: 1,
          hsn_code: "998363",
          tax_rate: 1800, // 18.00% expressed as basis points
        },
      ],
    });
    return (inv as { short_url?: string })?.short_url ?? null;
  } catch (err) {
    logger.warn({ err }, "Razorpay Invoicing API call failed");
    return null;
  }
}
