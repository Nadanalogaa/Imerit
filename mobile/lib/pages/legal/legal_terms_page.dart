import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../store/theme_provider.dart';
import 'legal_shell.dart';

/// Mobile port of web/src/pages/LegalTerms.tsx. Any text change here
/// should also happen there — legal copy is intentionally identical
/// across web + mobile.
class LegalTermsPage extends ConsumerWidget {
  const LegalTermsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return LegalShell(
      title: 'Terms of Service',
      lastUpdated: DateTime(2026, 7, 21),
      children: [
        const LegalP(
          'These Terms of Service ("Terms") govern your access to and use of i-Tamil Recruit (the "Service"), operated by Rudraa HR Solutions Pvt Ltd ("we", "us", "our"). By registering for or using the Service you agree to be bound by these Terms.',
        ),

        const LegalH2('1. Eligibility'),
        const LegalP(
          'You must be at least 18 years old, or the age of legal majority in your jurisdiction, to use the Service. By registering you represent that all information you provide is true, accurate, and complete.',
        ),

        const LegalH2('2. Account roles'),
        const LegalP('The Service supports three primary account types:'),
        LegalUl([
          LegalP('', rich: [
            legalStrong('Candidates', isDark: isDark),
            const TextSpan(text: ' — individuals seeking employment opportunities.'),
          ]),
          LegalP('', rich: [
            legalStrong('Employers', isDark: isDark),
            const TextSpan(text: ' — organisations posting jobs and reviewing candidate profiles.'),
          ]),
          LegalP('', rich: [
            legalStrong('Staff / Admin', isDark: isDark),
            const TextSpan(text: ' — internal accounts provisioned by Rudraa HR Solutions.'),
          ]),
        ]),

        const LegalH2('3. Subscriptions and payments'),
        const LegalP(
          'Certain features require an active paid subscription. All transactions are processed by Razorpay Software Pvt Ltd through methods including UPI, credit/debit cards, netbanking, and wallets. Prices displayed are in Indian Rupees (INR) and include Goods and Services Tax (GST) where applicable.',
        ),
        const LegalP(
          'Subscriptions activate immediately upon successful payment and remain active for the duration specified in the plan. A GST-compliant tax invoice will be emailed to the address on your account for every completed payment.',
        ),

        const LegalH2('4. Refunds'),
        LegalP('', rich: [
          const TextSpan(text: 'Please refer to our '),
          legalLink('Refund Policy', isDark: isDark, onTap: () => context.go('/legal/refund')),
          const TextSpan(text: ' for detailed refund terms.'),
        ]),

        const LegalH2('5. Acceptable use'),
        const LegalP('You agree that you will not:'),
        const LegalUl([
          LegalP('Post false, misleading, or fraudulent information;'),
          LegalP('Impersonate any person or entity;'),
          LegalP('Harass, threaten, or otherwise cause harm to other users;'),
          LegalP('Attempt to gain unauthorised access to any account or system;'),
          LegalP('Scrape, harvest, or otherwise extract data from the Service in bulk without prior written consent;'),
          LegalP('Use the Service for any unlawful purpose, including discrimination on the basis of caste, religion, race, sex, place of birth, or any protected characteristic under Indian law.'),
        ]),

        const LegalH2('6. Content and moderation'),
        const LegalP(
          'User-generated content (profiles, job postings, applications) is subject to review by our moderation team. We reserve the right to remove or reject content that violates these Terms, applicable law, or our community standards, without prior notice.',
        ),

        const LegalH2('7. Intellectual property'),
        const LegalP(
          'All software, design, trademarks, and content provided by the Service (excluding user-generated content) are the property of Rudraa HR Solutions Pvt Ltd or its licensors and are protected by applicable intellectual property laws.',
        ),

        const LegalH2('8. Termination'),
        const LegalP(
          'We may suspend or terminate your account, with or without notice, if you violate these Terms or engage in conduct we determine, in our sole discretion, to be harmful to other users or to the Service. Upon termination, your right to use the Service ceases immediately; provisions concerning intellectual property, disclaimers, and limitation of liability survive.',
        ),

        const LegalH2('9. Disclaimers'),
        const LegalP(
          'The Service is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the suitability of any job posting or candidate for any specific purpose. All hiring decisions are made independently by employers, and we are not a party to any employment relationship between candidates and employers.',
        ),

        const LegalH2('10. Limitation of liability'),
        const LegalP(
          'To the maximum extent permitted by law, Rudraa HR Solutions Pvt Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. Our aggregate liability for any claim shall not exceed the amount you have paid us in the twelve months preceding the claim.',
        ),

        const LegalH2('11. Governing law and jurisdiction'),
        const LegalP(
          'These Terms are governed by the laws of India. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts at Chennai, Tamil Nadu.',
        ),

        const LegalH2('12. Changes to these Terms'),
        const LegalP(
          'We may update these Terms from time to time. Material changes will be notified via email to the address on your account and by a notice on the Service. Continued use after such notice constitutes acceptance of the revised Terms.',
        ),

        const LegalH2('13. Contact'),
        const LegalP(
          'Questions or concerns regarding these Terms can be sent to websitedevelopment@itamilrecruit.net.',
        ),
      ],
    );
  }
}
