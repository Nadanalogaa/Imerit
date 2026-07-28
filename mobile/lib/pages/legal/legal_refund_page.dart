import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';
import 'legal_shell.dart';

/// Mobile port of web/src/pages/LegalRefund.tsx.
class LegalRefundPage extends ConsumerWidget {
  const LegalRefundPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return LegalShell(
      title: 'Refund Policy',
      lastUpdated: DateTime(2026, 7, 21),
      children: [
        const LegalP(
          'This Refund Policy applies to all paid subscriptions on i-Tamil Recruit ("the Service"), operated by Rudraa HR Solutions Pvt Ltd. By purchasing a subscription you agree to the terms below.',
        ),

        const LegalH2('1. 24-hour full refund window'),
        LegalP('', rich: [
          const TextSpan(text: 'If you are dissatisfied with your subscription for any reason, you may request a full refund within '),
          legalStrong('24 hours', isDark: isDark),
          const TextSpan(text: ' of the successful payment timestamp shown on your invoice. Refund requests received within this window will be processed in full, including GST.'),
        ]),

        const LegalH2('2. Refunds after 24 hours'),
        const LegalP(
          'After the 24-hour window, subscription fees are non-refundable. This applies whether or not the subscription has been actively used. In exceptional circumstances (billing error, duplicate charge, service outage of more than 24 continuous hours) we may process a refund at our discretion.',
        ),

        const LegalH2('3. How to request a refund'),
        const LegalP(
          'Send an email to websitedevelopment@itamilrecruit.net from the address associated with your account. Include:',
        ),
        const LegalUl([
          LegalP('Your registered email'),
          LegalP('The invoice number (visible on your Account settings page)'),
          LegalP('The reason for the refund'),
        ]),
        LegalP('', rich: [
          const TextSpan(text: 'Approved refunds are initiated within '),
          legalStrong('2 business days', isDark: isDark),
          const TextSpan(text: ' of approval. The amount will typically appear in your original payment method within '),
          legalStrong('5–7 business days', isDark: isDark),
          const TextSpan(text: ', depending on your bank or card issuer.'),
        ]),

        const LegalH2('4. Effect of refund'),
        const LegalP(
          'When a refund is issued, your subscription is terminated immediately. Access to any paid features (unlimited applications, candidate search, etc.) is revoked at the moment the refund is processed on our side, regardless of when the money reaches your account.',
        ),

        const LegalH2('5. Failed or disputed transactions'),
        const LegalP(
          'If your bank or card issuer initiates a chargeback for a transaction, we reserve the right to suspend the associated account pending investigation. Please contact us first before disputing a charge — most issues are resolved faster by email than by chargeback.',
        ),

        const LegalH2('6. Payment processor'),
        const LegalP(
          'All refunds are processed through Razorpay Software Pvt Ltd, the same payment processor used for the original transaction. We do not have the ability to refund via alternative methods.',
        ),

        const LegalH2('7. Changes to this policy'),
        const LegalP(
          'We may update this Refund Policy from time to time. Changes will be posted on this page with a revised "Last updated" date. Any change applies only to purchases made after the effective date.',
        ),

        const LegalH2('8. Contact'),
        const LegalP(
          'For any questions about refunds, write to websitedevelopment@itamilrecruit.net.',
        ),
      ],
    );
  }
}
