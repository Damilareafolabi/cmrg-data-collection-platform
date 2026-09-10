import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/db_service.dart';
import '../services/api_service.dart';

class SyncScreen extends StatefulWidget {
  const SyncScreen({Key? key}) : super(key: key);

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  List<SubmissionRecord> _allSubmissions = [];
  bool _isSyncing = false;
  String? _syncSummary;

  @override
  void initState() {
    super.initState();
    _loadSubmissions();
  }

  Future<void> _loadSubmissions() async {
    final list = await LocalDatabaseService.getCompleted();
    setState(() {
      _allSubmissions = list;
    });
  }

  Future<void> _startSync() async {
    final pending = _allSubmissions.where((s) => s.syncStatus != 'SYNCED').toList();
    if (pending.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All submissions are already synchronized.')),
      );
      return;
    }

    setState(() {
      _isSyncing = true;
      _syncSummary = null;
    });

    final deviceId = await LocalDatabaseService.getDeviceId();
    final user = await LocalDatabaseService.getCurrentUser();

    final result = await ApiService.syncSubmissions(
      submissions: pending,
      deviceId: deviceId,
      enumeratorId: user?.id ?? 'enum_1',
      enumeratorName: user?.name ?? 'Enumerator',
    );

    if (result['success'] == true) {
      final syncedCount = result['syncedCount'] ?? 0;
      final dupCount = result['duplicatesDetected'] ?? 0;

      final ids = pending.map((p) => p.clientSubmissionId).toList();
      await LocalDatabaseService.markSynced(ids);
      await _loadSubmissions();

      setState(() {
        _syncSummary = 'Synchronized $syncedCount submissions ($dupCount duplicates reconciled safely).';
      });
    } else {
      setState(() {
        _syncSummary = 'Sync failed: ${result['error'] ?? 'Network timeout. Saved offline.'}';
      });
    }

    setState(() => _isSyncing = false);
  }

  @override
  Widget build(BuildContext context) {
    final pending = _allSubmissions.where((s) => s.syncStatus != 'SYNCED').toList();
    final synced = _allSubmissions.where((s) => s.syncStatus == 'SYNCED').toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text(
          'Synchronization Hub',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: Colors.white),
        ),
      ),
      body: Column(
        children: [
          // Top Action Banner
          Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF1E293B),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${pending.length} Submissions Pending',
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${synced.length} previously synchronized',
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: _isSyncing || pending.isEmpty ? null : _startSync,
                      icon: _isSyncing
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.cloud_upload, size: 18),
                      label: Text(_isSyncing ? 'Syncing...' : 'Sync Now'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0284C7),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
                if (_syncSummary != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0369A1).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF0284C7)),
                    ),
                    child: Text(
                      _syncSummary!,
                      style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Submissions List
          Expanded(
            child: _allSubmissions.isEmpty
                ? const Center(
                    child: Text(
                      'No completed interviews yet.\nFinalized surveys will queue here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF94A3B8)),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _allSubmissions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = _allSubmissions[index];
                      final isSynced = item.syncStatus == 'SYNCED';

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF334155)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isSynced ? const Color(0xFF065F46) : const Color(0xFF9A3412),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                isSynced ? Icons.check_circle_outline : Icons.schedule,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.formTitle,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'UUID: ${item.clientSubmissionId.substring(0, 14)}...',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontFamily: 'monospace'),
                                  ),
                                  Text(
                                    'Recorded: ${item.submittedAt.split('T').first}',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isSynced ? const Color(0xFF065F46).withOpacity(0.3) : const Color(0xFFEA580C).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                isSynced ? 'SYNCED' : 'QUEUED',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isSynced ? const Color(0xFF34D399) : const Color(0xFFFB923C),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
