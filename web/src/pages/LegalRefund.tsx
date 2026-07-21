import { Navbar } from "../components/Navbar";
import { LegalShell } from "./LegalShell";

/**
 * Refund policy. Razorpay's KYC team checks that the site has a
 * clearly-stated refund policy before enabling live payments — this
 * page is that. Default stance: 24h full refund window, no refund
 * after (option C from the planning discussion).
 */
export function LegalRefund() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <LegalShell title="Refund Policy" lastUpdated="2026-07-21">
        <p>
          This Refund Policy applies to all paid subscriptions on i-Tamil
          Recruit ("the Service"), operated by Rudraa HR Solutions Pvt Ltd.
          By purchasing a subscription you agree to the terms below.
        </p>

        <h2>1. 24-hour full refund window</h2>
        <p>
          If you are dissatisfied with your subscription for any reason,
          you may request a full refund within <strong>24 hours</strong> of
          the successful payment timestamp shown on your invoice. Refund
          requests received within this window will be processed in full,
          including GST.
        </p>

        <h2>2. Refunds after 24 hours</h2>
        <p>
          After the 24-hour window, subscription fees are non-refundable.
          This applies whether or not the subscription has been actively
          used. In exceptional circumstances (billing error, duplicate
          charge, service outage of more than 24 continuous hours) we may
          process a refund at our discretion.
        </p>

        <h2>3. How to request a refund</h2>
        <p>
          Send an email to{" "}
          <a href="mailto:websitedevelopment@itamilrecruit.net" className="text-brand-600 underline dark:text-brand-400">
            websitedevelopment@itamilrecruit.net
          </a>{" "}
          from the address associated with your account. Include:
        </p>
        <ul>
          <li>Your registered email</li>
          <li>The invoice number (visible on your Account settings page)</li>
          <li>The reason for the refund</li>
        </ul>
        <p>
          Approved refunds are initiated within <strong>2 business days</strong>
          {" "}of approval. The amount will typically appear in your
          original payment method within <strong>5–7 business days</strong>,
          depending on your bank or card issuer.
        </p>

        <h2>4. Effect of refund</h2>
        <p>
          When a refund is issued, your subscription is terminated
          immediately. Access to any paid features (unlimited applications,
          candidate search, etc.) is revoked at the moment the refund is
          processed on our side, regardless of when the money reaches your
          account.
        </p>

        <h2>5. Failed or disputed transactions</h2>
        <p>
          If your bank or card issuer initiates a chargeback for a
          transaction, we reserve the right to suspend the associated
          account pending investigation. Please contact us first before
          disputing a charge — most issues are resolved faster by email
          than by chargeback.
        </p>

        <h2>6. Payment processor</h2>
        <p>
          All refunds are processed through Razorpay Software Pvt Ltd, the
          same payment processor used for the original transaction. We do
          not have the ability to refund via alternative methods.
        </p>

        <h2>7. Changes to this policy</h2>
        <p>
          We may update this Refund Policy from time to time. Changes will
          be posted on this page with a revised "Last updated" date. Any
          change applies only to purchases made after the effective date.
        </p>

        <h2>8. Contact</h2>
        <p>
          For any questions about refunds, write to{" "}
          <a href="mailto:websitedevelopment@itamilrecruit.net" className="text-brand-600 underline dark:text-brand-400">
            websitedevelopment@itamilrecruit.net
          </a>
          .
        </p>
      </LegalShell>
    </div>
  );
}
