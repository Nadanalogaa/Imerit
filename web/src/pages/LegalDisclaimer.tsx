import { Navbar } from "../components/Navbar";
import { LegalShell } from "./LegalShell";

const RED = "#dc2626";

export function LegalDisclaimer() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <LegalShell title="Disclaimer" titleStyle={{ color: RED }}>
        <p>
          <strong style={{ color: RED }}>
            Subscription Fee, Payment Purpose &amp; Fraud Disclaimer:
          </strong>{" "}
          The candidate subscription fee of <strong>₹333</strong> is
          charged for the services provided by our team, including
          identifying relevant job opportunities and making them
          available through this portal to simplify the job search
          process.
        </p>

        <p>
          Our objective is to support candidates in finding suitable
          employment opportunities and contribute towards reducing
          unemployment.{" "}
          <strong>
            Subscription does not guarantee employment or job placement.
          </strong>
        </p>

        <p>
          <strong>
            No additional payment is required beyond the stated
            subscription fee.
          </strong>{" "}
          Candidates should not make any payment directly to our
          employees, recruiters, representatives, or any individual,
          group, or organisation claiming to act on our behalf.
        </p>

        <p>
          Our company will not be responsible for payments made to{" "}
          <strong>
            personal UPI IDs, personal bank accounts, individuals,
            groups, unauthorised third parties, or any other unofficial
            payment sources
          </strong>
          .
        </p>

        <p>
          Candidates are advised to remain vigilant against fraudulent
          activities, including{" "}
          <strong>
            phishing emails, fake messages, social media scams,
            misleading advertisements, impersonation, digital arrest
            scams, unauthorised websites, suspicious payment links, or
            any other form of online or financial fraud
          </strong>
          .
        </p>

        <p>
          For your safety, all subscription payments must be made{" "}
          <strong>
            only through the official payment facility available on our
            website or authorised mobile application(s)
          </strong>
          . Please verify that you are using our official platform
          before making any payment.
        </p>

        <p>
          We are committed to maintaining{" "}
          <strong>
            transparency, security, and responsible business practices
          </strong>{" "}
          and to operating in accordance with all applicable laws,
          government rules, and regulations.
        </p>
      </LegalShell>
    </div>
  );
}