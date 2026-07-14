import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage.dart';
import '../widgets/candidate_filter_sheet.dart';

// ============================================================================
// Saved searches — named CandidateFilterState blobs the employer can re-apply
// with one tap, plus an optional "notify me on new matches" toggle used by
// the notification bell.
// ============================================================================

@immutable
class SavedCandidateSearch {
  const SavedCandidateSearch({
    required this.id,
    required this.employerId,
    required this.name,
    required this.filters,
    this.notify = false,
    this.knownCandidateIds = const [],
    required this.createdAt,
  });

  final String id;
  final String employerId;
  final String name;
  final CandidateFilterState filters;
  final bool notify;

  /// Snapshot of the candidate IDs that matched the LAST time this saved
  /// search was reconciled. New IDs in the current pool minus this set are
  /// what get surfaced in the notification bell.
  final List<String> knownCandidateIds;
  final String createdAt;

  SavedCandidateSearch copyWith({
    String? name,
    CandidateFilterState? filters,
    bool? notify,
    List<String>? knownCandidateIds,
  }) =>
      SavedCandidateSearch(
        id: id,
        employerId: employerId,
        name: name ?? this.name,
        filters: filters ?? this.filters,
        notify: notify ?? this.notify,
        knownCandidateIds: knownCandidateIds ?? this.knownCandidateIds,
        createdAt: createdAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'employerId': employerId,
        'name': name,
        'filters': filters.toJson(),
        'notify': notify,
        'knownCandidateIds': knownCandidateIds,
        'createdAt': createdAt,
      };

  static SavedCandidateSearch fromJson(Map<String, dynamic> j) => SavedCandidateSearch(
        id: j['id'] as String,
        employerId: j['employerId'] as String,
        name: j['name'] as String,
        filters: CandidateFilterState.fromJson(j['filters'] as Map<String, dynamic>),
        notify: (j['notify'] as bool?) ?? false,
        knownCandidateIds: ((j['knownCandidateIds'] as List<dynamic>?) ?? const []).cast<String>(),
        createdAt: j['createdAt'] as String,
      );
}

class SavedSearchesNotifier extends Notifier<List<SavedCandidateSearch>> {
  @override
  List<SavedCandidateSearch> build() {
    final raw = Storage.instance.getString(StorageKeys.employerSavedSearches);
    if (raw == null) return const [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => SavedCandidateSearch.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  void _persist(List<SavedCandidateSearch> next) {
    state = next;
    Storage.instance.setString(
      StorageKeys.employerSavedSearches,
      jsonEncode(next.map((s) => s.toJson()).toList()),
    );
  }

  List<SavedCandidateSearch> forEmployer(String employerId) =>
      state.where((s) => s.employerId == employerId).toList();

  SavedCandidateSearch add({
    required String employerId,
    required String name,
    required CandidateFilterState filters,
    bool notify = false,
    List<String> initialCandidateIds = const [],
  }) {
    final now = DateTime.now();
    final search = SavedCandidateSearch(
      id: 'sav_${now.microsecondsSinceEpoch.toRadixString(36)}',
      employerId: employerId,
      name: name,
      filters: filters,
      notify: notify,
      // Seeding the "known" set with the currently-matching IDs prevents
      // the bell from firing for every existing candidate the moment the
      // search is saved.
      knownCandidateIds: initialCandidateIds,
      createdAt: now.toIso8601String(),
    );
    _persist([search, ...state]);
    return search;
  }

  void toggleNotify(String id) {
    _persist(state.map((s) => s.id == id ? s.copyWith(notify: !s.notify) : s).toList());
  }

  void remove(String id) {
    _persist(state.where((s) => s.id != id).toList());
  }

  /// Mark the current match set as "seen" — called after the notification
  /// bell has read the search once, so the next fire only shows NEW hits.
  void reconcile(String id, List<String> knownCandidateIds) {
    _persist(state
        .map((s) => s.id == id ? s.copyWith(knownCandidateIds: knownCandidateIds) : s)
        .toList());
  }
}

final savedSearchesProvider =
    NotifierProvider<SavedSearchesNotifier, List<SavedCandidateSearch>>(
        SavedSearchesNotifier.new);

// ============================================================================
// Shortlist — per-employer set of candidate IDs, persisted so re-opening
// the app keeps the shortlist intact for follow-up. Storage shape:
//   { employerId: [candidateId, ...] }
// ============================================================================

class ShortlistNotifier extends Notifier<Map<String, List<String>>> {
  @override
  Map<String, List<String>> build() {
    final raw = Storage.instance.getString(StorageKeys.employerShortlist);
    if (raw == null) return const {};
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return map.map((k, v) => MapEntry(k, (v as List<dynamic>).cast<String>()));
    } catch (_) {
      return const {};
    }
  }

  void _persist(Map<String, List<String>> next) {
    state = next;
    Storage.instance.setString(StorageKeys.employerShortlist, jsonEncode(next));
  }

  List<String> forEmployer(String employerId) => state[employerId] ?? const [];

  bool contains(String employerId, String candidateId) =>
      forEmployer(employerId).contains(candidateId);

  void toggle(String employerId, String candidateId) {
    final cur = List<String>.from(forEmployer(employerId));
    if (cur.contains(candidateId)) {
      cur.remove(candidateId);
    } else {
      cur.add(candidateId);
    }
    _persist({...state, employerId: cur});
  }

  void clear(String employerId) {
    _persist({...state, employerId: const []});
  }
}

final shortlistProvider =
    NotifierProvider<ShortlistNotifier, Map<String, List<String>>>(ShortlistNotifier.new);

// ============================================================================
// Recently viewed candidates — per-employer, capped at 10 entries, dedup +
// move-to-front. Persisted so an employer's browsing history survives an
// app restart.
// ============================================================================

const int _recentCap = 10;

class RecentCandidatesNotifier extends Notifier<Map<String, List<String>>> {
  @override
  Map<String, List<String>> build() {
    final raw = Storage.instance.getString(StorageKeys.employerRecentCandidates);
    if (raw == null) return const {};
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return map.map((k, v) => MapEntry(k, (v as List<dynamic>).cast<String>()));
    } catch (_) {
      return const {};
    }
  }

  void _persist(Map<String, List<String>> next) {
    state = next;
    Storage.instance.setString(StorageKeys.employerRecentCandidates, jsonEncode(next));
  }

  List<String> forEmployer(String employerId) => state[employerId] ?? const [];

  /// Push a viewed candidate to the front of the employer's history,
  /// deduping any earlier occurrence and trimming to [_recentCap].
  void push(String employerId, String candidateId) {
    final cur = List<String>.from(forEmployer(employerId))
      ..remove(candidateId);
    cur.insert(0, candidateId);
    if (cur.length > _recentCap) cur.removeRange(_recentCap, cur.length);
    _persist({...state, employerId: cur});
  }

  void clear(String employerId) {
    _persist({...state, employerId: const []});
  }
}

final recentCandidatesProvider =
    NotifierProvider<RecentCandidatesNotifier, Map<String, List<String>>>(
        RecentCandidatesNotifier.new);
