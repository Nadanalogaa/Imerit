import { Router, raw, type Request } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createOrder,
  handleWebhook,
  listMySubscriptions,
  refundSubscription,
  verifyPayment,
} from "../services/subscriptions.service.js";

const router = Router();

const paramId = (raw: string | string[] | undefined): string => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) throw new HttpError(400, "id is required", "ID_REQUIRED");
  return v;
};

/* ---------- Candidate / Employer — buy a subscription ---------- */

/**
 * Step 1 — POST /subscriptions/order { planId } → Razorpay Order.
 * Returns everything the frontend needs to open the Razorpay
 * checkout modal.
 */
router.post(
  "/subscriptions/order",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body as { planId?: unknown };
    if (typeof body.planId !== "string" || !body.planId) {
      throw new HttpError(400, "planId is required", "MISSING_PLAN");
    }
    const out = await createOrder({ userId: req.user!.sub, planId: body.planId });
    res.status(201).json(out);
  }),
);

/**
 * Step 2 — POST /subscriptions/verify with the fields Razorpay hands
 * back after checkout. Activates the subscription server-side.
 */
router.post(
  "/subscriptions/verify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body as {
      orderId?: unknown;
      paymentId?: unknown;
      signature?: unknown;
    };
    if (
      typeof body.orderId !== "string" ||
      typeof body.paymentId !== "string" ||
      typeof body.signature !== "string"
    ) {
      throw new HttpError(400, "orderId, paymentId, and signature are required", "MISSING_FIELDS");
    }
    const sub = await verifyPayment({
      orderId: body.orderId,
      paymentId: body.paymentId,
      signature: body.signature,
      userId: req.user!.sub,
    });
    res.json({ subscription: sub });
  }),
);

/** GET /subscriptions/me — user's own subscription history. */
router.get(
  "/subscriptions/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ items: await listMySubscriptions(req.user!.sub) });
  }),
);

/* ---------- Admin — refund a subscription ---------- */

router.post(
  "/admin/subscriptions/:id/refund",
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const body = req.body as { reason?: unknown };
    const updated = await refundSubscription({
      subscriptionId: paramId(req.params.id),
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    });
    res.json({ subscription: updated });
  }),
);

/* ---------- Razorpay webhook (server-to-server) ---------- */

/**
 * POST /webhooks/razorpay — signed by Razorpay's dashboard webhook
 * secret. We need the raw body (not JSON-parsed) to verify the HMAC
 * signature — parsing loses the exact byte sequence Razorpay signed.
 * The `raw()` middleware below overrides the app-level JSON parser
 * for this route only.
 *
 * IMPORTANT: this route is unauthenticated by design — Razorpay
 * can't hold our JWT. The HMAC signature IS the auth.
 */
router.post(
  "/webhooks/razorpay",
  raw({ type: "application/json", limit: "1mb" }),
  asyncHandler(async (req: Request, res) => {
    const signature = req.header("x-razorpay-signature");
    if (!signature) {
      throw new HttpError(400, "Missing x-razorpay-signature header", "MISSING_SIGNATURE");
    }
    const rawBody = (req.body as Buffer).toString("utf8");
    let parsed: { event?: string; payload?: Record<string, unknown> };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new HttpError(400, "Webhook body is not valid JSON", "BAD_JSON");
    }
    if (!parsed.event || !parsed.payload) {
      throw new HttpError(400, "Malformed webhook payload", "BAD_PAYLOAD");
    }
    await handleWebhook({
      rawBody,
      signature,
      event: parsed.event,
      payload: parsed.payload,
    });
    // Razorpay retries any non-2xx — respond fast and always with 200
    // once we've cleared the signature check.
    res.json({ ok: true });
  }),
);

export default router;
