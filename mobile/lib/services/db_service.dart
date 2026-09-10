import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/models.dart';

class LocalDatabaseService {
  static const String formsKey = 'cmrg_local_forms';
  static const String draftsKey = 'cmrg_local_drafts';
  static const String completedKey = 'cmrg_local_completed';
  static const String deviceIdKey = 'cmrg_device_id';
  static const String currentUserKey = 'cmrg_current_user';

  static final _uuid = Uuid();

  /// Returns unique persistent hardware/installation ID
  static Future<String> getDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    String? id = prefs.getString(deviceIdKey);
    if (id == null) {
      id = 'DEV-CMRG-${_uuid.v4().substring(0, 8).toUpperCase()}';
      await prefs.setString(deviceIdKey, id);
    }
    return id;
  }

  /// Current logged-in user
  static Future<User?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(currentUserKey);
    if (userStr == null) return null;
    try {
      return User.fromJson(jsonDecode(userStr));
    } catch (_) {
      return null;
    }
  }

  static Future<void> setCurrentUser(User? user) async {
    final prefs = await SharedPreferences.getInstance();
    if (user == null) {
      await prefs.remove(currentUserKey);
    } else {
      await prefs.setString(currentUserKey, jsonEncode(user.toJson()));
    }
  }

  /// Cache downloaded forms
  static Future<void> saveForms(List<FormDefinition> forms) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = forms.map((f) => f.toJson()).toList();
    await prefs.setString(formsKey, jsonEncode(jsonList));
  }

  static Future<List<FormDefinition>> getForms() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString(formsKey);
    if (str == null) return [];
    try {
      final List list = jsonDecode(str);
      return list.map((item) => FormDefinition.fromJson(item)).toList();
    } catch (_) {
      return [];
    }
  }

  /// Save interview draft
  static Future<void> saveDraft(SubmissionRecord draft) async {
    final drafts = await getDrafts();
    drafts.removeWhere((d) => d.clientSubmissionId == draft.clientSubmissionId);
    drafts.insert(0, draft);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(draftsKey, jsonEncode(drafts.map((d) => d.toJson()).toList()));
  }

  static Future<List<SubmissionRecord>> getDrafts() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString(draftsKey);
    if (str == null) return [];
    try {
      final List list = jsonDecode(str);
      return list.map((d) => SubmissionRecord.fromJson(d)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> deleteDraft(String clientSubmissionId) async {
    final drafts = await getDrafts();
    drafts.removeWhere((d) => d.clientSubmissionId == clientSubmissionId);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(draftsKey, jsonEncode(drafts.map((d) => d.toJson()).toList()));
  }

  /// Save completed submission ready for sync
  static Future<void> saveCompleted(SubmissionRecord record) async {
    final list = await getCompleted();
    list.removeWhere((s) => s.clientSubmissionId == record.clientSubmissionId);
    list.insert(0, record);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(completedKey, jsonEncode(list.map((s) => s.toJson()).toList()));
  }

  static Future<List<SubmissionRecord>> getCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    final str = prefs.getString(completedKey);
    if (str == null) return [];
    try {
      final List list = jsonDecode(str);
      return list.map((s) => SubmissionRecord.fromJson(s)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> markSynced(List<String> clientSubmissionIds) async {
    final list = await getCompleted();
    final updated = list.map((s) {
      if (clientSubmissionIds.contains(s.clientSubmissionId)) {
        return SubmissionRecord(
          id: s.id,
          clientSubmissionId: s.clientSubmissionId,
          projectId: s.projectId,
          projectName: s.projectName,
          formId: s.formId,
          formTitle: s.formTitle,
          formVersionId: s.formVersionId,
          versionNumber: s.versionNumber,
          enumeratorId: s.enumeratorId,
          enumeratorName: s.enumeratorName,
          deviceId: s.deviceId,
          status: 'APPROVED',
          syncStatus: 'SYNCED',
          answers: s.answers,
          geolocation: s.geolocation,
          createdAt: s.createdAt,
          submittedAt: s.submittedAt,
        );
      }
      return s;
    }).toList();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(completedKey, jsonEncode(updated.map((s) => s.toJson()).toList()));
  }
}
