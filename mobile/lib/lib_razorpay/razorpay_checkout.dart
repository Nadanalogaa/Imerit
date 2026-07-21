import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../api/subscriptions_api.dart';

/// Mobile counterpart to web's `lib/razorpay.ts`. Wraps the two-step
/// Razorpay flow (createOrder → open native checkout → /verify)
/// behind a single `pay(...)` call.
///
/// Callers instantiate one `RazorpayCheckout` per page (typically
/// in initState), hook the three callbacks, and call `pay(...)` to
/// start the flow. Always call `dispose()` in the widget's dispose.
class RazorpayCheckout {
  RazorpayCheckout({
    required this.onSuccess,
    required this.onError,
    this.onDismiss,
  }) {
    _rzp = Razorpay();
    _rzp.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleSuccess);
    _rzp.on(Razorpay.EVENT_PAYMENT_ERROR, _handleError);
    _rzp.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  final void Function(ApiSubscription subscription) onSuccess;
  final void Function(String message) onError;
  final VoidCallback? onDismiss;

  late final Razorpay _rzp;

  /// Open Razorpay checkout for a plan. Fires onSuccess with the
  /// activated Subscription on happy path, onError with a friendly
  /// string on any failure at any step.
  Future<void> pay({
    required String planId,
    required String planLabel,
    String? userName,
    String? userEmail,
    String? userMobile,
  }) async {
    ApiOrder order;
    try {
      order = await SubscriptionsApi.instance.createOrder(planId);
    } catch (e) {
      onError(e is Exception ? e.toString() : 'Could not start the payment. Try again.');
      return;
    }

    final opts = <String, dynamic>{
      'key': order.key,
      'amount': order.amount,
      'currency': order.currency,
      'name': 'i-Tamil Recruit',
      'description': planLabel,
      'order_id': order.orderId,
      'prefill': {
        if (userName != null) 'name': userName,
        if (userEmail != null) 'email': userEmail,
        if (userMobile != null) 'contact': userMobile,
      },
      'theme': {'color': '#F97316'},
      // Timeout at 5 min — Razorpay's default is longer; shorter
      // gives us cleaner UX when a distracted user leaves the modal
      // open and comes back to an expired session.
      'timeout': 300,
    };

    try {
      _rzp.open(opts);
    } catch (e) {
      onError('Could not open payment sheet: $e');
    }
  }

  Future<void> _handleSuccess(PaymentSuccessResponse response) async {
    // Backend does the signature verification — never trust the
    // client-side signature alone.
    final orderId = response.orderId;
    final paymentId = response.paymentId;
    final signature = response.signature;
    if (orderId == null || paymentId == null || signature == null) {
      onError('Payment succeeded but the response was incomplete. Contact support.');
      return;
    }
    try {
      final sub = await SubscriptionsApi.instance.verify(
        orderId: orderId,
        paymentId: paymentId,
        signature: signature,
      );
      onSuccess(sub);
    } catch (e) {
      onError(
        'Payment received but verification failed. Contact support with reference $paymentId.',
      );
    }
  }

  void _handleError(PaymentFailureResponse response) {
    // Razorpay's native error codes: 0 = network, 1 = user cancel,
    // 2 = payment failed. We surface a friendly message either way.
    if (response.code == Razorpay.PAYMENT_CANCELLED) {
      onDismiss?.call();
      return;
    }
    onError(response.message ?? 'Payment failed. Please try again.');
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // Only fires when the user picks a wallet the SDK can't
    // resolve inline. Rare edge case; just log for now.
    if (kDebugMode) {
      // ignore: avoid_print
      print('[razorpay] external wallet selected: ${response.walletName}');
    }
  }

  void dispose() {
    _rzp.clear();
  }
}
