import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage.dart';

@immutable
class Application {
  const Application({
    required this.id,
    required this.userId,
    required this.jobId,
    required this.appliedAt,
    this.status = 'submitted',
  });

  final String id;
  final String userId;
  final String jobId;
  final String appliedAt;
  final String status;

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'jobId': jobId,
        'appliedAt': appliedAt,
        'status': status,
      };

  static Application fromJson(Map<String, dynamic> j) => Application(
        id: j['id'] as String,
        userId: j['userId'] as String,
        jobId: j['jobId'] as String,
        appliedAt: j['appliedAt'] as String,
        status: (j['status'] as String?) ?? 'submitted',
      );
}

const _appsKey = 'itr.applications';
const _savedKey = 'itr.savedJobs';

@immutable
class AppData {
  const AppData({required this.applications, required this.saved});
  final List<Application> applications;
  final Map<String, List<String>> saved;

  AppData copyWith({
    List<Application>? applications,
    Map<String, List<String>>? saved,
  }) =>
      AppData(
        applications: applications ?? this.applications,
        saved: saved ?? this.saved,
      );
}

class ApplicationsNotifier extends Notifier<AppData> {
  @override
  AppData build() {
    final apps = _loadApps();
    final saved = _loadSaved();
    return AppData(applications: apps, saved: saved);
  }

  List<Application> _loadApps() {
    final raw = Storage.instance.getString(_appsKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) => Application.fromJson(e as Map<String, dynamic>)).toList();
  }

  Map<String, List<String>> _loadSaved() {
    final raw = Storage.instance.getString(_savedKey);
    if (raw == null) return {};
    final map = jsonDecode(raw) as Map<String, dynamic>;
    return map.map((k, v) => MapEntry(k, (v as List<dynamic>).cast<String>()));
  }

  void _saveApps(List<Application> apps) {
    Storage.instance.setString(
      _appsKey,
      jsonEncode(apps.map((a) => a.toJson()).toList()),
    );
  }

  void _saveSaved(Map<String, List<String>> saved) {
    Storage.instance.setString(_savedKey, jsonEncode(saved));
  }

  Application? apply(String userId, String jobId) {
    if (state.applications.any((a) => a.userId == userId && a.jobId == jobId)) {
      return null;
    }
    final app = Application(
      id: 'app_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}',
      userId: userId,
      jobId: jobId,
      appliedAt: DateTime.now().toIso8601String(),
    );
    final next = [app, ...state.applications];
    _saveApps(next);
    state = state.copyWith(applications: next);
    return app;
  }

  bool hasApplied(String userId, String jobId) {
    return state.applications.any((a) => a.userId == userId && a.jobId == jobId);
  }

  void toggleSave(String userId, String jobId) {
    final cur = state.saved[userId] ?? [];
    final next = cur.contains(jobId)
        ? cur.where((id) => id != jobId).toList()
        : [jobId, ...cur];
    final newMap = {...state.saved, userId: next};
    _saveSaved(newMap);
    state = state.copyWith(saved: newMap);
  }

  bool isSaved(String userId, String jobId) =>
      (state.saved[userId] ?? []).contains(jobId);

  List<Application> appsFor(String userId) =>
      state.applications.where((a) => a.userId == userId).toList();

  List<String> savedFor(String userId) => state.saved[userId] ?? [];
}

final applicationsProvider =
    NotifierProvider<ApplicationsNotifier, AppData>(ApplicationsNotifier.new);
