import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';
import 'legal_shell.dart';

/// Mobile port of web/src/pages/LegalPrivacy.tsx.
class LegalPrivacyPage extends ConsumerWidget {
  const LegalPrivacyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return LegalShell(
      title: 'Privacy Policy',
      lastUpdated: DateTime(2026, 7, 21),
      children: [
        const LegalP(
          'This Privacy Policy describes how Rudraa HR Solutions Pvt Ltd ("we", "us", "our") collects, uses, discloses, and safeguards personal information you provide when using i-Tamil Recruit ("the Service"). We handle data in accordance with India\'s Digital Personal Data Protection Act, 2023 (DPDP).',
        ),

        const LegalH2('1. Information we collect'),
        const LegalP('We collect the following categories of information:'),
        LegalUl([
          LegalP('', rich: [
            legalStrong('Account information', isDark: isDark),
            const TextSpan(text: ' — name, email address, mobile number, role (candidate / employer / staff / admin).'),
          ]),
          LegalP('', rich: [
            legalStrong('Profile information', isDark: isDark),
            const TextSpan(text: ' — for candidates: work experience, education, skills, resume template, preferred locations. For employers: company name, industry, hiring contact.'),
          ]),
          LegalP('', rich: [
            legalStrong('Application data', isDark: isDark),
            const TextSpan(text: ' — jobs you apply to, saved jobs, application status transitions.'),
          ]),
          LegalP('', rich: [
            legalStrong('Payment metadata', isDark: isDark),
            const TextSpan(text: ' — plan purchased, invoice number, amount, GST breakdown. We do not store your card number, CVV, or bank credentials; those are handled by our payment processor.'),
          ]),
          LegalP('', rich: [
            legalStrong('Technical information', isDark: isDark),
            const TextSpan(text: ' — device type, browser user-agent, IP address, timestamps, and pages visited (for security and abuse prevention).'),
          ]),
        ]),

        const LegalH2('2. How we use your information'),
        const LegalP('Your information is used to:'),
        const LegalUl([
          LegalP('Provide, maintain, and improve the Service;'),
          LegalP('Match candidates with relevant job opportunities;'),
          LegalP('Communicate with you via email regarding account activity, applications, and administrative notices;'),
          LegalP('Process payments and issue tax invoices;'),
          LegalP('Detect, prevent, and investigate fraud, abuse, and security incidents;'),
          LegalP('Comply with legal obligations.'),
        ]),

        const LegalH2('3. Sharing of information'),
        LegalUl([
          LegalP('', rich: [
            legalStrong('With employers', isDark: isDark),
            const TextSpan(text: ' — when your profile is APPROVED by our moderation team, employers can find and view your profile.'),
          ]),
          LegalP('', rich: [
            legalStrong('With payment processors', isDark: isDark),
            const TextSpan(text: ' — Razorpay Software Pvt Ltd processes all payments; refer to Razorpay\'s own privacy policy for their handling.'),
          ]),
          LegalP('', rich: [
            legalStrong('With service providers', isDark: isDark),
            const TextSpan(text: ' — infrastructure providers (hosting, email delivery, analytics) under strict data-processing agreements.'),
          ]),
          LegalP('', rich: [
            legalStrong('Legal obligations', isDark: isDark),
            const TextSpan(text: ' — where required by law, court order, or in response to a valid governmental request.'),
          ]),
        ]),
        const LegalP('We do not sell personal information to third parties.'),

        const LegalH2('4. Data retention'),
        const LegalP(
          'Account and profile data is retained while your account is active and for up to 24 months after account deletion or prolonged inactivity, unless a longer retention period is required by law (e.g., tax records: 7 years). Payment records are retained per statutory requirements.',
        ),

        const LegalH2('5. Your rights (DPDP Act)'),
        const LegalP('You have the right to:'),
        const LegalUl([
          LegalP('Access the personal information we hold about you;'),
          LegalP('Correct inaccurate or incomplete data;'),
          LegalP('Request erasure of your data, subject to legal retention;'),
          LegalP('Withdraw consent (which may terminate your account);'),
          LegalP('Nominate an individual to exercise these rights on your behalf in the event of your death or incapacity;'),
          LegalP('Raise a grievance with our Grievance Officer.'),
        ]),

        const LegalH2('6. Security'),
        const LegalP(
          'We employ reasonable and appropriate technical and organisational measures to protect your data, including HTTPS transport encryption, at-rest encryption for sensitive fields, hashed passwords, and access controls on internal systems. No system is perfectly secure; you are responsible for keeping your account credentials confidential.',
        ),

        const LegalH2('7. Children'),
        const LegalP(
          'The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us to have it removed.',
        ),

        const LegalH2('8. Cookies and tracking'),
        const LegalP(
          'We use cookies for session authentication and to remember your preferences (e.g., dark / light theme). We do not use cross-site tracking cookies for advertising.',
        ),

        const LegalH2('9. International transfers'),
        const LegalP(
          'Our servers are located in India (AWS ap-south-1, Mumbai). Some service providers (e.g., email delivery) may process data outside India; any such transfer is subject to appropriate safeguards.',
        ),

        const LegalH2('10. Grievance Officer'),
        const LegalP(
          'Per the DPDP Act and the Information Technology (Reasonable Security Practices) Rules, 2011, our Grievance Officer can be contacted at:',
        ),
        LegalP('', rich: [
          legalStrong('Grievance Officer', isDark: isDark),
          const TextSpan(text: '\nRudraa HR Solutions Pvt Ltd\nEmail: websitedevelopment@itamilrecruit.net'),
        ]),
        const LegalP(
          'We aim to acknowledge grievances within 3 working days and resolve them within 30 days.',
        ),

        const LegalH2('11. Changes to this policy'),
        const LegalP(
          'We may update this Privacy Policy from time to time. Material changes will be notified via email to the address on your account. The current version is always available on this page.',
        ),
      ],
    );
  }
}
