-- Razorpay two-step flow: order → payment → (optional) refund.
-- Each id gets its own column so we can trace a single payment
-- through its lifecycle. `paymentRef` is kept for backward-compat
-- with older PENDING rows (currently holds order id).
ALTER TABLE "subscriptions" ADD COLUMN "razorpayOrderId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "razorpayPaymentId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "razorpayRefundId" TEXT;

-- Razorpay Invoicing API stores the PDF for us — we cache the URL so
-- the customer + admin can re-download from their inbox / dashboard.
ALTER TABLE "subscriptions" ADD COLUMN "invoiceUrl" TEXT;

-- Unique on the payment refs — Razorpay ids are globally unique so a
-- collision would mean corruption. Also lets us idempotently reconcile
-- from webhooks without racing the /verify endpoint.
CREATE UNIQUE INDEX "subscriptions_razorpayOrderId_key"
  ON "subscriptions"("razorpayOrderId");
CREATE UNIQUE INDEX "subscriptions_razorpayPaymentId_key"
  ON "subscriptions"("razorpayPaymentId");
