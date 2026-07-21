import 'api_client.dart';

/// Wrapper over /subscriptions/*. Same shape as web's
/// lib/api/subscriptions.ts.

class ApiOrder {
  ApiOrder({
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.key,
    required this.subscriptionId,
  });
  final String orderId;
  final int amount; // paise
  final String currency;
  final String key;
  final String subscriptionId;

  static ApiOrder fromJson(Map<String, dynamic> j) => ApiOrder(
        orderId: j['orderId'] as String,
        amount: j['amount'] as int,
        currency: j['currency'] as String,
        key: j['key'] as String,
        subscriptionId: j['subscriptionId'] as String,
      );
}

class ApiSubscription {
  ApiSubscription({
    required this.id,
    required this.userId,
    required this.planId,
    required this.paymentStatus,
    required this.amountInPaise,
    required this.gstInPaise,
    required this.totalInPaise,
    required this.startedAt,
    required this.expiresAt,
    this.paidAt,
    this.invoiceNumber,
    this.invoiceUrl,
  });
  final String id;
  final String userId;
  final String planId;
  final String paymentStatus; // PENDING | PAID | FAILED | REFUNDED
  final int amountInPaise;
  final int gstInPaise;
  final int totalInPaise;
  final String startedAt;
  final String expiresAt;
  final String? paidAt;
  final String? invoiceNumber;
  final String? invoiceUrl;

  static ApiSubscription fromJson(Map<String, dynamic> j) => ApiSubscription(
        id: j['id'] as String,
        userId: j['userId'] as String,
        planId: j['planId'] as String,
        paymentStatus: j['paymentStatus'] as String,
        amountInPaise: j['amountInPaise'] as int,
        gstInPaise: j['gstInPaise'] as int,
        totalInPaise: j['totalInPaise'] as int,
        startedAt: j['startedAt'] as String,
        expiresAt: j['expiresAt'] as String,
        paidAt: j['paidAt'] as String?,
        invoiceNumber: j['invoiceNumber'] as String?,
        invoiceUrl: j['invoiceUrl'] as String?,
      );
}

class SubscriptionsApi {
  SubscriptionsApi._();
  static final SubscriptionsApi instance = SubscriptionsApi._();
  final _c = ApiClient.instance;

  /// Step 1 — book a Razorpay order for a plan.
  Future<ApiOrder> createOrder(String planId) async {
    final res = await _c.post<Map<String, dynamic>>('/subscriptions/order', {
      'planId': planId,
    });
    return ApiOrder.fromJson(res);
  }

  /// Step 2 — send Razorpay's post-checkout tokens to the server for
  /// HMAC verify + activation.
  Future<ApiSubscription> verify({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    final res = await _c.post<Map<String, dynamic>>('/subscriptions/verify', {
      'orderId': orderId,
      'paymentId': paymentId,
      'signature': signature,
    });
    return ApiSubscription.fromJson(res['subscription'] as Map<String, dynamic>);
  }

  /// User's own subscription history.
  Future<List<ApiSubscription>> mine() async {
    final res = await _c.get<Map<String, dynamic>>('/subscriptions/me');
    return (res['items'] as List)
        .cast<Map<String, dynamic>>()
        .map(ApiSubscription.fromJson)
        .toList();
  }
}
