import { Navbar } from "../components/Navbar";
import { LegalShell } from "./LegalShell";

/**
 * Terms of Service. Written to satisfy Razorpay's KYC checklist plus
 * the basics of Indian consumer contract law (IT Act 2000, Consumer
 * Protection Act 2019). Any customer-facing change here should be
 * cleared with a lawyer before shipping — the current text is a
 * reasonable starting draft, not final advice.
 */
export function LegalTerms() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <LegalShell title="Terms of Service" lastUpdated="2026-07-21">
        <p>
          These Terms of Service ("Terms") govern your access to and use of
          i-Tamil Recruit (the "Service"), operated by Rudraa HR Solutions
          Pvt Ltd ("we", "us", "our"). By registering for or using the
          Service you agree to be bound by these Terms.
        </p>

        <h2>1. Eligibility</h2>
        <p>
          You must be at least 18 years old, or the age of legal majority in
          your jurisdiction, to use the Service. By registering you
          represent that all information you provide is true, accurate, and
          complete.
        </p>

        <h2>2. Account roles</h2>
        <p>The Service supports three primary account types:</p>
        <ul>
          <li>
            <strong>Candidates</strong> — individuals seeking employment
            opportunities.
          </li>
          <li>
            <strong>Employers</strong> — organisations posting jobs and
            reviewing candidate profiles.
          </li>
          <li>
            <strong>Staff / Admin</strong> — internal accounts provisioned
            by Rudraa HR Solutions.
          </li>
        </ul>

        <h2>3. Subscriptions and payments</h2>
        <p>
          Certain features require an active paid subscription. All
          transactions are processed by Razorpay Software Pvt Ltd through
          methods including UPI, credit/debit cards, netbanking, and
          wallets. Prices displayed are in Indian Rupees (INR) and include
          Goods and Services Tax (GST) where applicable.
        </p>
        <p>
          Subscriptions activate immediately upon successful payment and
          remain active for the duration specified in the plan. A
          GST-compliant tax invoice will be emailed to the address on your
          account for every completed payment.
        </p>

        <h2>4. Refunds</h2>
        <p>
          Please refer to our{" "}
          <a href="/legal/refund" className="text-brand-600 underline dark:text-brand-400">
            Refund Policy
          </a>{" "}
          for detailed refund terms.
        </p>

        <h2>5. Acceptable use</h2>
        <p>You agree that you will not:</p>
        <ul>
          <li>Post false, misleading, or fraudulent information;</li>
          <li>Impersonate any person or entity;</li>
          <li>
            Harass, threaten, or otherwise cause harm to other users;
          </li>
          <li>
            Attempt to gain unauthorised access to any account or system;
          </li>
          <li>
            Scrape, harvest, or otherwise extract data from the Service in
            bulk without prior written consent;
          </li>
          <li>
            Use the Service for any unlawful purpose, including
            discrimination on the basis of caste, religion, race, sex,
            place of birth, or any protected characteristic under Indian
            law.
          </li>
        </ul>

        <h2>6. Content and moderation</h2>
        <p>
          User-generated content (profiles, job postings, applications) is
          subject to review by our moderation team. We reserve the right to
          remove or reject content that violates these Terms, applicable
          law, or our community standards, without prior notice.
        </p>

        <h2>7. Intellectual property</h2>
        <p>
          All software, design, trademarks, and content provided by the
          Service (excluding user-generated content) are the property of
          Rudraa HR Solutions Pvt Ltd or its licensors and are protected by
          applicable intellectual property laws.
        </p>

        <h2>8. Termination</h2>
        <p>
          We may suspend or terminate your account, with or without notice,
          if you violate these Terms or engage in conduct we determine, in
          our sole discretion, to be harmful to other users or to the
          Service. Upon termination, your right to use the Service ceases
          immediately; provisions concerning intellectual property,
          disclaimers, and limitation of liability survive.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          The Service is provided on an "as is" and "as available" basis.
          We make no warranties, express or implied, regarding the
          suitability of any job posting or candidate for any specific
          purpose. All hiring decisions are made independently by
          employers, and we are not a party to any employment relationship
          between candidates and employers.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Rudraa HR Solutions Pvt
          Ltd shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages arising from your use of or
          inability to use the Service. Our aggregate liability for any
          claim shall not exceed the amount you have paid us in the twelve
          months preceding the claim.
        </p>

        <h2>11. Governing law and jurisdiction</h2>
        <p>
          These Terms are governed by the laws of India. Any dispute
          arising out of or in connection with these Terms shall be subject
          to the exclusive jurisdiction of the courts at Chennai, Tamil
          Nadu.
        </p>

        <h2>12. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes
          will be notified via email to the address on your account and by
          a notice on the Service. Continued use after such notice
          constitutes acceptance of the revised Terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions or concerns regarding these Terms can be sent to{" "}
          <a href="mailto:websitedevelopment@itamilrecruit.net" className="text-brand-600 underline dark:text-brand-400">
            websitedevelopment@itamilrecruit.net
          </a>
          .
        </p>
      </LegalShell>
    </div>
  );
}
