import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

class SubscriptionPlansPage extends ConsumerWidget {
  const SubscriptionPlansPage({
    super.key,
    this.returnTo = '/candidate/dashboard',
    this.applyJob,
  });

  final String returnTo;
  final String? applyJob;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final user = ref.watch(authProvider)!;
    final active = ref.watch(subscriptionsProvider.notifier).activeFor(user.id, SubscriberType.candidate);
    final plan = planById('plan_cand_45')!;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go(returnTo),
        ),
        title: const Text('Subscription', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'CANDIDATE SUBSCRIPTION',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
                color: Color(0xFFEA580C),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'One simple plan to apply',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.5,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "Posting your profile is always free. Subscribe only when you're ready to apply.",
              style: TextStyle(
                fontSize: 13,
                height: 1.5,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.6)
                    : const Color(0xFF52525B),
              ),
            ),
            const SizedBox(height: 20),
            if (active != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.10),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.30)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.shield_rounded, size: 20, color: Color(0xFF059669)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "You're already subscribed",
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF059669)),
                          ),
                          Text(
                            'Active until ${_formatDate(DateTime.parse(active.expiresAt))}',
                            style: TextStyle(fontSize: 11, color: const Color(0xFF059669).withValues(alpha: 0.85)),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => context.go(returnTo),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        elevation: 0,
                      ),
                      child: const Text('Continue', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ),

            // Plan card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFEDD5), Color(0xFFFEF3C7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF97316).withValues(alpha: 0.4), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF97316).withValues(alpha: 0.25),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFEA580C),
                          borderRadius: BorderRadius.all(Radius.circular(999)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome_rounded, size: 11, color: Colors.white),
                            SizedBox(width: 4),
                            Text(
                              'MOST POPULAR',
                              style: TextStyle(
                                fontSize: 9,
                                letterSpacing: 1.2,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          const Icon(Icons.currency_rupee_rounded, size: 18, color: Color(0xFF09090B)),
                          Text(
                            '${plan.priceInr}',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF09090B),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    plan.label,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF09090B)),
                  ),
                  Text(
                    'No GST · No hidden fees',
                    style: TextStyle(fontSize: 11, color: const Color(0xFF52525B).withValues(alpha: 0.85)),
                  ),
                  const SizedBox(height: 16),
                  ...plan.benefits.map((b) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFFEA580C)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                b,
                                style: const TextStyle(fontSize: 13, color: Color(0xFF3F3F46), height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final query = StringBuffer('plan=${plan.id}');
                        query.write('&return=${Uri.encodeQueryComponent(returnTo)}');
                        if (applyJob != null) query.write('&apply=$applyJob');
                        context.go('/candidate/payment?$query');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEA580C),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 6,
                        shadowColor: const Color(0xFFEA580C).withValues(alpha: 0.4),
                      ),
                      child: Text(
                        'Subscribe — pay ₹${plan.priceInr}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text(
                      'Secure payment · Cancel anytime',
                      style: TextStyle(
                        fontSize: 10.5,
                        color: const Color(0xFF52525B).withValues(alpha: 0.85),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatDate(DateTime d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${d.day} ${months[d.month - 1]} ${d.year}';
}
