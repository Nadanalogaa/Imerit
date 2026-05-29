import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage.dart';

enum SubscriberType { candidate, employerSme, employerLarge }

String _typeKey(SubscriberType t) => switch (t) {
      SubscriberType.candidate => 'candidate',
      SubscriberType.employerSme => 'employer_sme',
      SubscriberType.employerLarge => 'employer_large',
    };
SubscriberType _typeFrom(String s) => switch (s) {
      'employer_sme' => SubscriberType.employerSme,
      'employer_large' => SubscriberType.employerLarge,
      _ => SubscriberType.candidate,
    };

@immutable
class Subscription {
  const Subscription({
    required this.id,
    required this.userId,
    required this.planId,
    required this.type,
    required this.priceInr,
    required this.durationDays,
    required this.startedAt,
    required this.expiresAt,
    required this.paymentRef,
  });

  final String id;
  final String userId;
  final String planId;
  final SubscriberType type;
  final int priceInr;
  final int durationDays;
  final String startedAt;
  final String expiresAt;
  final String paymentRef;

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'planId': planId,
        'type': _typeKey(type),
        'priceInr': priceInr,
        'durationDays': durationDays,
        'startedAt': startedAt,
        'expiresAt': expiresAt,
        'paymentRef': paymentRef,
      };

  static Subscription fromJson(Map<String, dynamic> j) => Subscription(
        id: j['id'] as String,
        userId: j['userId'] as String,
        planId: j['planId'] as String,
        type: _typeFrom(j['type'] as String),
        priceInr: j['priceInr'] as int,
        durationDays: j['durationDays'] as int,
        startedAt: j['startedAt'] as String,
        expiresAt: j['expiresAt'] as String,
        paymentRef: j['paymentRef'] as String,
      );
}

class Plan {
  const Plan({
    required this.id,
    required this.type,
    required this.label,
    required this.priceInr,
    required this.durationDays,
    required this.gst,
    required this.benefits,
  });
  final String id;
  final SubscriberType type;
  final String label;
  final int priceInr;
  final int durationDays;
  final bool gst;
  final List<String> benefits;
}

const plans = [
  Plan(
    id: 'plan_cand_45',
    type: SubscriberType.candidate,
    label: 'Candidate · 45 days',
    priceInr: 333,
    durationDays: 45,
    gst: false,
    benefits: [
      'Unlimited applications for 45 days',
      'Direct visibility to subscribed employers',
      'Profile boosted in candidate searches',
      'Cancel anytime',
    ],
  ),
  Plan(id: 'plan_sme_9',   type: SubscriberType.employerSme,   label: 'SME · 9 days',    priceInr: 1701,  durationDays: 9,   gst: true, benefits: []),
  Plan(id: 'plan_sme_18',  type: SubscriberType.employerSme,   label: 'SME · 18 days',   priceInr: 3402,  durationDays: 18,  gst: true, benefits: []),
  Plan(id: 'plan_sme_27',  type: SubscriberType.employerSme,   label: 'SME · 27 days',   priceInr: 6804,  durationDays: 27,  gst: true, benefits: []),
  Plan(id: 'plan_lg_54',   type: SubscriberType.employerLarge, label: 'Large · 54 days',  priceInr: 13608, durationDays: 54,  gst: true, benefits: []),
  Plan(id: 'plan_lg_108',  type: SubscriberType.employerLarge, label: 'Large · 108 days', priceInr: 27216, durationDays: 108, gst: true, benefits: []),
  Plan(id: 'plan_lg_216',  type: SubscriberType.employerLarge, label: 'Large · 216 days', priceInr: 54432, durationDays: 216, gst: true, benefits: []),
];

Plan? planById(String id) {
  for (final p in plans) {
    if (p.id == id) return p;
  }
  return null;
}

int gstAmount(int price, bool applies) =>
    applies ? (price * 0.18).round() : 0;

class SubscriptionsNotifier extends Notifier<List<Subscription>> {
  @override
  List<Subscription> build() {
    final raw = Storage.instance.getString(StorageKeys.subscriptions);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => Subscription.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  void add(Subscription s) {
    final next = [s, ...state];
    state = next;
    Storage.instance.setString(
      StorageKeys.subscriptions,
      jsonEncode(next.map((s) => s.toJson()).toList()),
    );
  }

  Subscription? activeFor(String userId, SubscriberType type) {
    final now = DateTime.now();
    for (final s in state) {
      if (s.userId == userId &&
          s.type == type &&
          DateTime.parse(s.expiresAt).isAfter(now)) {
        return s;
      }
    }
    return null;
  }
}

final subscriptionsProvider =
    NotifierProvider<SubscriptionsNotifier, List<Subscription>>(
        SubscriptionsNotifier.new);
