import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/applications_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

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
  final _name = TextEditingController();
  final _card = TextEditingController();
  final _expiry = TextEditingController();
  final _cvv = TextEditingController();
  bool _processing = false;
  bool _success = false;

  @override
  void dispose() {
    _name.dispose();
    _card.dispose();
    _expiry.dispose();
    _cvv.dispose();
    super.dispose();
  }

  void _pay() {
    final plan = planById(widget.planId);
    if (plan == null) return;
    setState(() => _processing = true);

    Future.delayed(const Duration(milliseconds: 1500), () {
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
              paymentRef: 'FAKE_${now.millisecondsSinceEpoch.toRadixString(36).toUpperCase()}',
            ),
          );
      if (widget.applyJob != null) {
        // Fire and forget — this is post-payment "auto-apply to the
        // job that triggered the subscribe flow"; if it fails the
        // user can still hit Apply on the job page.
        // ignore: unawaited_futures
        ref.read(applicationsProvider.notifier).applyAsync(user.id, widget.applyJob!);
      }
      setState(() {
        _processing = false;
        _success = true;
      });
      Future.delayed(const Duration(milliseconds: 1700), () {
        if (!mounted) return;
        if (widget.applyJob != null) {
          context.go('/candidate/jobs/${widget.applyJob}');
        } else {
          context.go(widget.returnTo);
        }
      });
    });
  }

  String _formatCard(String v) {
    final d = v.replaceAll(RegExp(r'\D'), '');
    final clipped = d.length > 16 ? d.substring(0, 16) : d;
    final buf = StringBuffer();
    for (var i = 0; i < clipped.length; i++) {
      if (i > 0 && i % 4 == 0) buf.write(' ');
      buf.write(clipped[i]);
    }
    return buf.toString();
  }

  String _formatExp(String v) {
    final d = v.replaceAll(RegExp(r'\D'), '');
    final clipped = d.length > 4 ? d.substring(0, 4) : d;
    if (clipped.length > 2) return '${clipped.substring(0, 2)}/${clipped.substring(2)}';
    return clipped;
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
          ? _SuccessView(plan: plan, isDark: isDark, applyJob: widget.applyJob)
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
                          'Active for ${plan.durationDays} days from today',
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

                  // Card form
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
                            const Icon(Icons.credit_card_rounded, size: 18, color: Color(0xFFEA580C)),
                            const SizedBox(width: 8),
                            Text(
                              'Card details',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : const Color(0xFF09090B),
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.lock_rounded, size: 9, color: Color(0xFF059669)),
                                  SizedBox(width: 4),
                                  Text(
                                    'DEMO',
                                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF059669), letterSpacing: 1),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        _PayField(label: 'Cardholder name', controller: _name, hint: 'Karthick S.', isDark: isDark),
                        const SizedBox(height: 12),
                        _PayField(
                          label: 'Card number',
                          controller: _card,
                          hint: '4242 4242 4242 4242',
                          isDark: isDark,
                          mono: true,
                          keyboardType: TextInputType.number,
                          onChanged: (v) {
                            final f = _formatCard(v);
                            if (f != v) {
                              _card.value = TextEditingValue(
                                text: f,
                                selection: TextSelection.collapsed(offset: f.length),
                              );
                            }
                          },
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _PayField(
                                label: 'Expiry (MM/YY)',
                                controller: _expiry,
                                hint: '12/27',
                                isDark: isDark,
                                mono: true,
                                keyboardType: TextInputType.number,
                                onChanged: (v) {
                                  final f = _formatExp(v);
                                  if (f != v) {
                                    _expiry.value = TextEditingValue(
                                      text: f,
                                      selection: TextSelection.collapsed(offset: f.length),
                                    );
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _PayField(
                                label: 'CVV',
                                controller: _cvv,
                                hint: '123',
                                isDark: isDark,
                                mono: true,
                                keyboardType: TextInputType.number,
                                maxLength: 4,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
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
                                      Text(
                                        'Processing payment...',
                                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700),
                                      ),
                                    ],
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.lock_rounded, size: 14),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Pay ₹$total',
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                        const SizedBox(height: 8),
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
                                'No real charges — demo payment',
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

class _PayField extends StatelessWidget {
  const _PayField({
    required this.label,
    required this.controller,
    required this.hint,
    required this.isDark,
    this.mono = false,
    this.keyboardType,
    this.maxLength,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String hint;
  final bool isDark;
  final bool mono;
  final TextInputType? keyboardType;
  final int? maxLength;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isDark
                ? Colors.white.withValues(alpha: 0.8)
                : const Color(0xFF52525B),
          ),
        ),
        const SizedBox(height: 5),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLength: maxLength,
          inputFormatters: keyboardType == TextInputType.number
              ? [FilteringTextInputFormatter.digitsOnly]
              : null,
          onChanged: onChanged,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white : const Color(0xFF09090B),
            fontFamily: mono ? 'monospace' : null,
            letterSpacing: mono ? 1.5 : 0,
          ),
          decoration: InputDecoration(
            counterText: '',
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.3)
                  : const Color(0xFFA1A1AA),
              fontFamily: mono ? 'monospace' : null,
            ),
            isDense: true,
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.10)
                    : const Color(0xFFE4E4E7),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.10)
                    : const Color(0xFFE4E4E7),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFEA580C), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({required this.plan, required this.isDark, this.applyJob});
  final Plan plan;
  final bool isDark;
  final String? applyJob;

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
            ],
          ),
        ),
      ),
    );
  }
}
