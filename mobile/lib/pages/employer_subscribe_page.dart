import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

// Employer plan list (mirrors web)
const _smePlans = [
  Plan(id: 'plan_sme_9',   type: SubscriberType.employerSme,   label: 'SME · 9 days',    priceInr: 1701,  durationDays: 9,   gst: true, benefits: []),
  Plan(id: 'plan_sme_18',  type: SubscriberType.employerSme,   label: 'SME · 18 days',   priceInr: 3402,  durationDays: 18,  gst: true, benefits: []),
  Plan(id: 'plan_sme_27',  type: SubscriberType.employerSme,   label: 'SME · 27 days',   priceInr: 6804,  durationDays: 27,  gst: true, benefits: []),
];

const _largePlans = [
  Plan(id: 'plan_lg_54',   type: SubscriberType.employerLarge, label: 'Large · 54 days',  priceInr: 13608, durationDays: 54,  gst: true, benefits: []),
  Plan(id: 'plan_lg_108',  type: SubscriberType.employerLarge, label: 'Large · 108 days', priceInr: 27216, durationDays: 108, gst: true, benefits: []),
  Plan(id: 'plan_lg_216',  type: SubscriberType.employerLarge, label: 'Large · 216 days', priceInr: 54432, durationDays: 216, gst: true, benefits: []),
];

class EmployerSubscribePage extends ConsumerWidget {
  const EmployerSubscribePage({super.key, this.returnTo = '/employer/dashboard'});
  final String returnTo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final employer = ref.watch(authProvider)!;
    final subNotifier = ref.watch(subscriptionsProvider.notifier);
    final active = subNotifier.activeFor(employer.id, SubscriberType.employerSme) ??
        subNotifier.activeFor(employer.id, SubscriberType.employerLarge);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go(returnTo)),
        title: const Text('Plans', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('EMPLOYER SUBSCRIPTION', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFF0369A1))),
            const SizedBox(height: 6),
            Text('Pick your plan', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5, color: isDark ? Colors.white : const Color(0xFF09090B))),
            const SizedBox(height: 6),
            Text('Job posting is always free. Subscribe to view full candidate profiles + contact directly.', style: TextStyle(fontSize: 13, height: 1.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
            if (active != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFF10B981).withValues(alpha: 0.10), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.30))),
                child: Row(
                  children: [
                    const Icon(Icons.shield_rounded, size: 18, color: Color(0xFF059669)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("You're already subscribed", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF059669))),
                          Text('Active until ${_fmt(DateTime.parse(active.expiresAt))}', style: const TextStyle(fontSize: 11, color: Color(0xFF059669))),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => context.go(returnTo),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)), elevation: 0),
                      child: const Text('Continue', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 22),
            Row(children: [
              const Icon(Icons.business_rounded, size: 16, color: Color(0xFF0EA5E9)),
              const SizedBox(width: 6),
              Text('SME — 1 to 50 employees', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.2, color: isDark ? Colors.white : const Color(0xFF09090B))),
              const SizedBox(width: 6),
              Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: const Color(0xFF0EA5E9).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)), child: const Text('POPULAR', style: TextStyle(fontSize: 9, letterSpacing: 1, fontWeight: FontWeight.w800, color: Color(0xFF0369A1)))),
            ]),
            const SizedBox(height: 10),
            ..._smePlans.map((p) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _PlanCard(plan: p, accent: const [Color(0xFF0EA5E9), Color(0xFF0369A1)], returnTo: returnTo, isDark: isDark))),
            const SizedBox(height: 16),
            Row(children: [
              const Icon(Icons.apartment_rounded, size: 16, color: Color(0xFF7C3AED)),
              const SizedBox(width: 6),
              Text('Medium & Large — Above 50', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.2, color: isDark ? Colors.white : const Color(0xFF09090B))),
            ]),
            const SizedBox(height: 10),
            ..._largePlans.map((p) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _PlanCard(plan: p, accent: const [Color(0xFF7C3AED), Color(0xFFC026D3)], returnTo: returnTo, isDark: isDark))),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan, required this.accent, required this.returnTo, required this.isDark});
  final Plan plan;
  final List<Color> accent;
  final String returnTo;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final gst = gstAmount(plan.priceInr, plan.gst);
    final total = plan.priceInr + gst;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(plan.label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B)))),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Icon(Icons.currency_rupee_rounded, size: 16, color: isDark ? Colors.white : const Color(0xFF09090B)),
                  Text('${plan.priceInr.toString()}', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
                ],
              ),
            ],
          ),
          Text('Active for ${plan.durationDays} days · + ₹$gst GST', style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.go('/employer/payment?plan=${plan.id}&return=${Uri.encodeQueryComponent(returnTo)}'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                backgroundColor: accent.first,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 4,
                shadowColor: accent.first.withValues(alpha: 0.4),
              ),
              child: Text('Subscribe — pay ₹$total', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

String _fmt(DateTime d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${d.day} ${months[d.month - 1]} ${d.year}';
}
