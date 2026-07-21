import { Navbar } from "../components/Navbar";
import { LegalShell } from "./LegalShell";

/**
 * Privacy Policy, drafted to line up with India's Digital Personal
 * Data Protection Act, 2023 (DPDP), plus Razorpay's KYC needs. Same
 * caveat as Terms: get a lawyer to review before shipping to a
 * regulated audience.
 */
export function LegalPrivacy() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <LegalShell title="Privacy Policy" lastUpdated="2026-07-21">
        <p>
          This Privacy Policy describes how Rudraa HR Solutions Pvt Ltd
          ("we", "us", "our") collects, uses, discloses, and safeguards
          personal information you provide when using i-Tamil Recruit
          ("the Service"). We handle data in accordance with India's
          Digital Personal Data Protection Act, 2023 (DPDP).
        </p>

        <h2>1. Information we collect</h2>
        <p>We collect the following categories of information:</p>
        <ul>
          <li>
            <strong>Account information</strong> — name, email address,
            mobile number, role (candidate / employer / staff / admin).
          </li>
          <li>
            <strong>Profile information</strong> — for candidates: work
            experience, education, skills, resume template, preferred
            locations. For employers: company name, industry, hiring
            contact.
          </li>
          <li>
            <strong>Application data</strong> — jobs you apply to, saved
            jobs, application status transitions.
          </li>
          <li>
            <strong>Payment metadata</strong> — plan purchased, invoice
            number, amount, GST breakdown. We do <em>not</em> store your
            card number, CVV, or bank credentials; those are handled by
            our payment processor.
          </li>
          <li>
            <strong>Technical information</strong> — device type, browser
            user-agent, IP address, timestamps, and pages visited (for
            security and abuse prevention).
          </li>
        </ul>

        <h2>2. How we use your information</h2>
        <p>Your information is used to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service;</li>
          <li>Match candidates with relevant job opportunities;</li>
          <li>
            Communicate with you via email regarding account activity,
            applications, and administrative notices;
          </li>
          <li>Process payments and issue tax invoices;</li>
          <li>
            Detect, prevent, and investigate fraud, abuse, and security
            incidents;
          </li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>3. Sharing of information</h2>
        <ul>
          <li>
            <strong>With employers</strong> — when your profile is APPROVED
            by our moderation team, employers can find and view your
            profile.
          </li>
          <li>
            <strong>With payment processors</strong> — Razorpay Software
            Pvt Ltd processes all payments; refer to Razorpay's own
            privacy policy for their handling.
          </li>
          <li>
            <strong>With service providers</strong> — infrastructure
            providers (hosting, email delivery, analytics) under strict
            data-processing agreements.
          </li>
          <li>
            <strong>Legal obligations</strong> — where required by law,
            court order, or in response to a valid governmental request.
          </li>
        </ul>
        <p>We do not sell personal information to third parties.</p>

        <h2>4. Data retention</h2>
        <p>
          Account and profile data is retained while your account is
          active and for up to 24 months after account deletion or
          prolonged inactivity, unless a longer retention period is
          required by law (e.g., tax records: 7 years). Payment records
          are retained per statutory requirements.
        </p>

        <h2>5. Your rights (DPDP Act)</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you;</li>
          <li>Correct inaccurate or incomplete data;</li>
          <li>Request erasure of your data, subject to legal retention;</li>
          <li>Withdraw consent (which may terminate your account);</li>
          <li>
            Nominate an individual to exercise these rights on your behalf
            in the event of your death or incapacity;
          </li>
          <li>Raise a grievance with our Grievance Officer.</li>
        </ul>

        <h2>6. Security</h2>
        <p>
          We employ reasonable and appropriate technical and organisational
          measures to protect your data, including HTTPS transport
          encryption, at-rest encryption for sensitive fields, hashed
          passwords, and access controls on internal systems. No system is
          perfectly secure; you are responsible for keeping your account
          credentials confidential.
        </p>

        <h2>7. Children</h2>
        <p>
          The Service is not intended for individuals under the age of 18.
          We do not knowingly collect personal information from children.
          If you believe we have collected information from a child, please
          contact us to have it removed.
        </p>

        <h2>8. Cookies and tracking</h2>
        <p>
          We use cookies for session authentication and to remember your
          preferences (e.g., dark / light theme). We do not use
          cross-site tracking cookies for advertising.
        </p>

        <h2>9. International transfers</h2>
        <p>
          Our servers are located in India (AWS ap-south-1, Mumbai). Some
          service providers (e.g., email delivery) may process data outside
          India; any such transfer is subject to appropriate safeguards.
        </p>

        <h2>10. Grievance Officer</h2>
        <p>
          Per the DPDP Act and the Information Technology (Reasonable
          Security Practices) Rules, 2011, our Grievance Officer can be
          contacted at:
        </p>
        <p>
          <strong>Grievance Officer</strong>
          <br />
          Rudraa HR Solutions Pvt Ltd
          <br />
          Email:{" "}
          <a href="mailto:websitedevelopment@itamilrecruit.net" className="text-brand-600 underline dark:text-brand-400">
            websitedevelopment@itamilrecruit.net
          </a>
        </p>
        <p>We aim to acknowledge grievances within 3 working days and resolve them within 30 days.</p>

        <h2>11. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material
          changes will be notified via email to the address on your
          account. The current version is always available on this page.
        </p>
      </LegalShell>
    </div>
  );
}
