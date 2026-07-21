import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../api/subscriptions_api.dart';
import '../lib_razorpay/razorpay_checkout.dart';
import '../store/auth_provider.dart';
import '../store/applications_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

/// Payment page for candidate + employer plans. Mirrors the web
/// PaymentScreen: no card form, one big "Pay ₹X" button that opens
/// Razorpay's native checkout (SDK owns cards / UPI / netbanking /
/// wallets).
///
/// Falls back to the offline "fake" flow when apiEnabled is false so
/// demo builds without a backend keep working.
class PaymentPage extends ConsumerStatefulWidget {
  const PaymentPage({
    super.key,
    required this.planId,
    this.returnTo = '/candidate/dashboard',
    this.applyJob,
  });

  final String planId;
  final String returnTo;
  final String? applyJob;

  @override
  ConsumerState<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends ConsumerState<PaymentPage> {
  RazorpayCheckout? _checkout;
  bool _processing = false;
  bool _success = false;
  String? _error;
  String? _invoiceRef;

  @override
  void initState() {
    super.initState();
    if (apiEnabled) {
      _checkout = RazorpayCheckout(
        onSuccess: _onPaymentSuccess,
        onError: _onPaymentError,
        onDismiss: _onPaymentDismiss,
      );
    }
  }

  @override
  void dispose() {
    _checkout?.dispose();
    super.dispose();
  }

  void _onPaymentSuccess(ApiSubscription sub) {
    final plan = planById(widget.planId);
    if (plan == null) return;
    final user = ref.read(authProvider)!;
    // Mirror into the local subscriptions cache so existing
    // "am I subscribed?" checks (which still read localStorage) work
    // until the mobile subscriptions provider lands its own port.
    ref.read(subscriptionsProvider.notifier).add(
          Subscription(
            id: sub.id,
            userId: user.id,
            planId: plan.id,
            type: plan.type,
            priceInr: plan.priceInr,
            durationDays: plan.durationDays,
            startedAt: sub.startedAt,
            expiresAt: sub.expiresAt,
            paymentRef: sub.invoiceNumber ?? sub.id,
          ),
        );
    if (widget.applyJob != null) {
      // Auto-apply to the job that led the user here. Fire-and-forget;
      // if it fails they can retry from the job page.
      // ignore: unawaited_futures
      ref.read(applicationsProvider.notifier).applyAsync(user.id, widget.applyJob!);
    }
    if (!mounted) return;
    setState(() {
      _processing = false;
      _success = true;
      _invoiceRef = sub.invoiceNumber ?? sub.id;
    });
    Future.delayed(const Duration(milliseconds: 1900), () {
      if (!mounted) return;
      context.go(widget.applyJob != null ? '/candidate/jobs/${widget.applyJob}' : widget.returnTo);
    });
  }

  void _onPaymentError(String message) {
    if (!mounted) return;
    setState(() {
      _processing = false;
      _error = message;
    });
  }

  void _onPaymentDismiss() {
    // User closed the Razorpay modal — treat as "not paid, retry
    // available" with no error banner (dismissal is intentional).
    if (!mounted) return;
    setState(() => _processing = false);
  }

  Future<void> _pay() async {
    final plan = planById(widget.planId);
    if (plan == null) return;
    setState(() {
      _processing = true;
      _error = null;
    });

    if (!apiEnabled) {
      // Offline / demo — keep the fake flow so previews work.
      await Future.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
      final user = ref.read(authProvider)!;
      final now = DateTime.now();
      final exp = now.add(Duration(days: plan.durationDays));
      ref.read(subscriptionsProvider.notifier).add(
            Subscription(
              id: 'sub_${now.microsecondsSinceEpoch.toRadixString(36)}',
              userId: user.id,
              planId: plan.id,
              type: plan.type,
              priceInr: plan.priceInr,
              durationDays: plan.durationDays,
              startedAt: now.toIso8601String(),
              expiresAt: exp.toIso8601String(),
              paymentRef: 'OFFLINE_${now.millisecondsSinceEpoch.toRadixString(36).toUpperCase()}',
            ),
          );
      if (widget.applyJob != null) {
        // ignore: unawaited_futures
        ref.read(applicationsProvider.notifier).applyAsync(user.id, widget.applyJob!);
      }
      setState(() {
        _processing = false;
        _success = true;
        _invoiceRef = 'OFFLINE-DEMO';
      });
      Future.delayed(const Duration(milliseconds: 1700), () {
        if (!mounted) return;
        context.go(widget.applyJob != null ? '/candidate/jobs/${widget.applyJob}' : widget.returnTo);
      });
      return;
    }

    // Real Razorpay checkout — this hands off to the native modal.
    final user = ref.read(authProvider)!;
    await _checkout!.pay(
      planId: plan.id,
      planLabel: plan.label,
      userName: user.name,
      userEmail: user.email,
      userMobile: user.mobile,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final plan = planById(widget.planId);
    if (plan == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go(widget.returnTo));
      return const SizedBox.shrink();
    }
    final gst = gstAmount(plan.priceInr, plan.gst);
    final total = plan.priceInr + gst;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            final back = '/candidate/subscribe?return=${Uri.encodeQueryComponent(widget.returnTo)}'
                '${widget.applyJob != null ? "&apply=${widget.applyJob}" : ""}';
            context.go(back);
          },
        ),
        title: const Text('Payment', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: _success
          ? _SuccessView(plan: plan, isDark: isDark, applyJob: widget.applyJob, invoiceRef: _invoiceRef)
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Order summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFFEDD5), Color(0xFFFEF3C7)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ORDER SUMMARY',
                          style: TextStyle(
                            fontSize: 10,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFC2410C),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(plan.label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF09090B))),
                        Text(
                          'Active for ${plan.durationDays} days from payment',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF52525B)),
                        ),
                        const SizedBox(height: 12),
                        _row('Plan', '₹${plan.priceInr}'),
                        if (plan.gst) _row('GST (18%)', '₹$gst'),
                        Container(height: 1, color: const Color(0xFF09090B).withValues(alpha: 0.10), margin: const EdgeInsets.symmetric(vertical: 8)),
                        _row('Total', '₹$total', bold: true),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Payment CTA (Razorpay owns the card / UPI / etc. UI)
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.08)
                            : const Color(0xFFE4E4E7),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.shield_outlined, size: 18, color: Color(0xFFEA580C)),
                            const SizedBox(width: 8),
                            Text(
                              'Complete payment',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : const Color(0xFF09090B),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          "You'll be handed off to Razorpay's secure checkout. UPI, cards, netbanking, and wallets all supported. GST invoice emailed on success.",
                          style: TextStyle(
                            fontSize: 12.5,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.65)
                                : const Color(0xFF52525B),
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: const [
                            _MethodChip(label: 'UPI'),
                            _MethodChip(label: 'Cards'),
                            _MethodChip(label: 'Netbanking'),
                            _MethodChip(label: 'Wallets'),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _processing ? null : _pay,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFEA580C),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 6,
                              shadowColor: const Color(0xFFEA580C).withValues(alpha: 0.4),
                              disabledBackgroundColor: const Color(0xFFEA580C).withValues(alpha: 0.65),
                              disabledForegroundColor: Colors.white,
                            ),
                            child: _processing
                                ? const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation(Colors.white),
                                        ),
                                      ),
                                      SizedBox(width: 10),
                                      Text('Opening checkout…', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
                                    ],
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.lock_rounded, size: 14),
                                      const SizedBox(width: 6),
                                      Text('Pay ₹$total', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                    ],
                                  ),
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFECDD3).withValues(alpha: isDark ? 0.15 : 1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _error!,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF9F1239)),
                            ),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.shield_outlined,
                                size: 12,
                                color: isDark
                                    ? Colors.white.withValues(alpha: 0.5)
                                    : const Color(0xFF71717A),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Payments processed by Razorpay · PCI-DSS compliant',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.55)
                                      : const Color(0xFF71717A),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Center(
                          child: Text(
                            'By continuing you agree to our Terms and Refund Policy.',
                            style: TextStyle(
                              fontSize: 10,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.45)
                                  : const Color(0xFF9CA3AF),
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

  Widget _row(String l, String r, {bool bold = false}) {
    final style = TextStyle(
      fontSize: bold ? 14 : 12.5,
      fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
      color: const Color(0xFF09090B),
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(l, style: style.copyWith(fontWeight: bold ? FontWeight.w800 : FontWeight.w500)),
          const Spacer(),
          Text(r, style: style),
        ],
      ),
    );
  }
}

class _MethodChip extends StatelessWidget {
  const _MethodChip({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE4E4E7)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFF3F3F46)),
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({required this.plan, required this.isDark, this.applyJob, this.invoiceRef});
  final Plan plan;
  final bool isDark;
  final String? applyJob;
  final String? invoiceRef;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFD1FAE5), Color(0xFFCCFBF1)],
            ),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withValues(alpha: 0.30),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 500),
                curve: Curves.elasticOut,
                builder: (_, t, _) => Transform.scale(
                  scale: t,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: [Color(0xFF10B981), Color(0xFF14B8A6)]),
                    ),
                    child: const Icon(Icons.check_rounded, size: 44, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Payment successful',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF09090B), letterSpacing: -0.4),
              ),
              const SizedBox(height: 6),
              Text(
                'Your ${plan.label.toLowerCase()} is active.\n${applyJob != null ? "Submitting your application..." : "Redirecting..."}',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFF3F3F46), height: 1.5),
              ),
              if (invoiceRef != null) ...[
                const SizedBox(height: 12),
                Text(
                  'Invoice: $invoiceRef',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF52525B), fontFamily: 'monospace'),
                ),
                const SizedBox(height: 4),
                const Text(
                  'A copy of your tax invoice has been emailed.',
                  style: TextStyle(fontSize: 10, color: Color(0xFF71717A)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
