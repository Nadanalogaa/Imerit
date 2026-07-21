import { subscriptionsApi, type ApiOrder, type ApiSubscription } from "./api/subscriptions";

/**
 * Small wrapper around Razorpay's checkout SDK. Encapsulates the
 * two-step flow (create order → open modal → verify signature) so
 * pages just call `payForPlan(...)` with a plan id and a couple of
 * user details.
 *
 * The SDK is loaded via a `<script async>` tag in index.html, so we
 * poll briefly on first use in case the user reached the payment
 * screen before the CDN request finished.
 */

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: string, handler: (data: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

async function waitForRazorpay(maxWaitMs = 4000): Promise<void> {
  if (window.Razorpay) return;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (window.Razorpay) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Razorpay checkout didn't load. Check your internet connection and try again.");
}

interface PayArgs {
  planId: string;
  planLabel: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (subscription: ApiSubscription) => void;
  onDismiss?: () => void;
  onError?: (message: string) => void;
}

/**
 * Full happy path — creates the order, opens the modal, verifies
 * the signature, returns the activated subscription via onSuccess.
 * Failures at any step fire onError with a user-facing message.
 */
export async function payForPlan(args: PayArgs): Promise<void> {
  let order: ApiOrder;
  try {
    order = await subscriptionsApi.createOrder(args.planId);
  } catch (err) {
    args.onError?.(
      err instanceof Error ? err.message : "Could not start the payment. Please try again.",
    );
    return;
  }

  try {
    await waitForRazorpay();
  } catch (err) {
    args.onError?.(err instanceof Error ? err.message : "Payment SDK failed to load.");
    return;
  }

  const rzp = new window.Razorpay!({
    key: order.key,
    amount: order.amount,
    currency: order.currency,
    name: "i-Tamil Recruit",
    description: args.planLabel,
    order_id: order.orderId,
    prefill: args.prefill,
    theme: { color: "#F97316" },
    handler: async (response) => {
      try {
        const { subscription } = await subscriptionsApi.verify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
        args.onSuccess(subscription);
      } catch (err) {
        args.onError?.(
          err instanceof Error
            ? `Payment received but verification failed: ${err.message}. Contact support with reference ${response.razorpay_payment_id}.`
            : "Payment received but verification failed. Contact support.",
        );
      }
    },
    modal: {
      ondismiss: () => args.onDismiss?.(),
    },
  });

  rzp.on("payment.failed", (data: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = (data as any)?.error;
    args.onError?.(err?.description ?? "Payment failed. Please try again.");
  });

  rzp.open();
}
