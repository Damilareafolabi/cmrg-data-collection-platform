import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/db_service.dart';
import '../services/api_service.dart';
import 'forms_screen.dart';
import 'drafts_screen.dart';
import 'sync_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  User? _currentUser;
  String _deviceId = '';
  int _formsCount = 0;
  int _draftsCount = 0;
  int _pendingCount = 0;
  int _syncedCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadState();
  }

  Future<void> _loadState() async {
    setState(() => _isLoading = true);

    final user = await LocalDatabaseService.getCurrentUser();
    final deviceId = await LocalDatabaseService.getDeviceId();
    final forms = await LocalDatabaseService.getForms();
    final drafts = await LocalDatabaseService.getDrafts();
    final completed = await LocalDatabaseService.getCompleted();

    final pending = completed.where((c) => c.syncStatus != 'SYNCED').length;
    final synced = completed.where((c) => c.syncStatus == 'SYNCED').length;

    setState(() {
      _currentUser = user;
      _deviceId = deviceId;
      _formsCount = forms.length;
      _draftsCount = drafts.length;
      _pendingCount = pending;
      _syncedCount = synced;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF0284C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.assignment_turned_in, size: 20, color: Colors.white),
            ),
            const SizedBox(width: 10),
            const Text(
              'CMRG Collect',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync, color: Colors.white),
            tooltip: 'Sync Queue',
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const SyncScreen()));
              _loadState();
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            tooltip: 'Settings',
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
              _loadState();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)))
          : RefreshIndicator(
              onRefresh: _loadState,
              color: const Color(0xFF0284C7),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Enumerator Profile Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: const Color(0xFF0369A1),
                            child: Text(
                              _currentUser?.name.isNotEmpty == true
                                  ? _currentUser!.name.substring(0, 1).toUpperCase()
                                  : 'E',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _currentUser?.name ?? 'Field Enumerator',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Terminal: $_deviceId',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontFamily: 'monospace'),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF065F46),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.wifi, size: 12, color: Color(0xFF34D399)),
                                SizedBox(width: 4),
                                Text('Offline Ready', style: TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Quick Operations Menu Grid
                    _buildActionCard(
                      title: 'Fill Blank Form',
                      subtitle: '$_formsCount assigned questionnaires available',
                      icon: Icons.add_circle_outline,
                      color: const Color(0xFF0284C7),
                      badge: _formsCount > 0 ? '$_formsCount' : null,
                      onTap: () async {
                        await Navigator.push(context, MaterialPageRoute(builder: (_) => const FormsScreen()));
                        _loadState();
                      },
                    ),
                    const SizedBox(height: 12),

                    _buildActionCard(
                      title: 'Edit Saved Form',
                      subtitle: '$_draftsCount unfinished interview drafts',
                      icon: Icons.edit_note,
                      color: const Color(0xFFD97706),
                      badge: _draftsCount > 0 ? '$_draftsCount' : null,
                      onTap: () async {
                        await Navigator.push(context, MaterialPageRoute(builder: (_) => const DraftsScreen()));
                        _loadState();
                      },
                    ),
                    const SizedBox(height: 12),

                    _buildActionCard(
                      title: 'Send Finalized Submissions',
                      subtitle: '$_pendingCount completed surveys pending upload',
                      icon: Icons.cloud_upload_outlined,
                      color: _pendingCount > 0 ? const Color(0xFFEA580C) : const Color(0xFF475569),
                      badge: _pendingCount > 0 ? '$_pendingCount PENDING' : null,
                      badgeColor: Colors.orangeAccent,
                      onTap: () async {
                        await Navigator.push(context, MaterialPageRoute(builder: (_) => const SyncScreen()));
                        _loadState();
                      },
                    ),
                    const SizedBox(height: 12),

                    _buildActionCard(
                      title: 'Get Blank Forms',
                      subtitle: 'Download updated questionnaires from CMRG Survey server',
                      icon: Icons.download_outlined,
                      color: const Color(0xFF10B981),
                      onTap: () async {
                        await Navigator.push(context, MaterialPageRoute(builder: (_) => const FormsScreen(isDownloadMode: true)));
                        _loadState();
                      },
                    ),

                    const SizedBox(height: 24),
                    // Summary Metrics Bar
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildMetric('Available Forms', '$_formsCount', const Color(0xFF0284C7)),
                          Container(width: 1, height: 32, color: const Color(0xFF334155)),
                          _buildMetric('Drafts', '$_draftsCount', const Color(0xFFD97706)),
                          Container(width: 1, height: 32, color: const Color(0xFF334155)),
                          _buildMetric('Queued', '$_pendingCount', const Color(0xFFEA580C)),
                          Container(width: 1, height: 32, color: const Color(0xFF334155)),
                          _buildMetric('Synced', '$_syncedCount', const Color(0xFF10B981)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    String? badge,
    Color? badgeColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 28, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor ?? color,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right, color: Color(0xFF64748B), size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetric(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
      ],
    );
  }
}
