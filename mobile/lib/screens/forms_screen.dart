import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/db_service.dart';
import '../services/api_service.dart';
import 'interview_screen.dart';

class FormsScreen extends StatefulWidget {
  final bool isDownloadMode;
  const FormsScreen({Key? key, this.isDownloadMode = false}) : super(key: key);

  @override
  State<FormsScreen> createState() => _FormsScreenState();
}

class _FormsScreenState extends State<FormsScreen> {
  List<FormDefinition> _forms = [];
  bool _isLoading = true;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _loadForms();
  }

  Future<void> _loadForms() async {
    setState(() => _isLoading = true);

    if (widget.isDownloadMode) {
      final remoteForms = await ApiService.fetchForms();
      if (remoteForms.isNotEmpty) {
        await LocalDatabaseService.saveForms(remoteForms);
        _forms = remoteForms;
        _statusMessage = 'Successfully updated ${remoteForms.length} questionnaires from server.';
      } else {
        _forms = await LocalDatabaseService.getForms();
        _statusMessage = 'Could not reach server. Showing locally cached questionnaires.';
      }
    } else {
      _forms = await LocalDatabaseService.getForms();
      if (_forms.isEmpty) {
        // Try fetching once if cache empty
        final remoteForms = await ApiService.fetchForms();
        if (remoteForms.isNotEmpty) {
          await LocalDatabaseService.saveForms(remoteForms);
          _forms = remoteForms;
        }
      }
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(
          widget.isDownloadMode ? 'Download Blank Forms' : 'Assigned Questionnaires',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadForms,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)))
          : Column(
              children: [
                if (_statusMessage != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    color: const Color(0xFF0369A1).withOpacity(0.2),
                    child: Text(
                      _statusMessage!,
                      style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 12),
                    ),
                  ),
                Expanded(
                  child: _forms.isEmpty
                      ? const Center(
                          child: Text(
                            'No questionnaires found.\nConnect to server to download forms.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Color(0xFF94A3B8)),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _forms.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final form = _forms[index];
                            return _buildFormCard(form);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildFormCard(FormDefinition form) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  form.title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF0284C7).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'v${form.currentVersion}.0',
                  style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          if (form.description.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              form.description,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.help_outline, size: 14, color: Color(0xFF64748B)),
              const SizedBox(width: 4),
              Text(
                '${form.questions.length} Questions',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => InterviewScreen(form: form),
                    ),
                  );
                },
                icon: const Icon(Icons.play_arrow, size: 18),
                label: const Text('Start Interview'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
