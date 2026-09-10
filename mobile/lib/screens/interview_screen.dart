import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:record/record.dart';
import 'dart:convert';
import 'dart:io';
import '../models/models.dart';
import '../services/form_engine.dart';
import '../services/db_service.dart';

class InterviewScreen extends StatefulWidget {
  final FormDefinition form;
  final SubmissionRecord? existingDraft;

  const InterviewScreen({Key? key, required this.form, this.existingDraft}) : super(key: key);

  @override
  State<InterviewScreen> createState() => _InterviewScreenState();
}

class _InterviewScreenState extends State<InterviewScreen> {
  final Map<String, dynamic> _answers = {};
  final Map<String, String> _errors = {};
  late String _clientSubmissionId;
  GeoLocation? _capturedLocation;
  bool _isSaving = false;
  final ImagePicker _imagePicker = ImagePicker();
  final AudioRecorder _audioRecorder = AudioRecorder();
  bool _isRecordingAudio = false;
  String? _recordingQuestionName;

  @override
  void initState() {
    super.initState();
    if (widget.existingDraft != null) {
      _clientSubmissionId = widget.existingDraft!.clientSubmissionId;
      _answers.addAll(widget.existingDraft!.answers);
      _capturedLocation = widget.existingDraft!.geolocation;
    } else {
      _clientSubmissionId = const Uuid().v4();
    }
    _runCalculations();
  }

  @override
  void dispose() {
    _audioRecorder.dispose();
    super.dispose();
  }

  void _runCalculations() {
    for (final q in widget.form.questions) {
      if (q.type == 'calculate' || q.calculation != null) {
        final isRelevant = FormEngine.evaluateRelevance(q.relevant, _answers);
        if (isRelevant && q.calculation != null) {
          final calc = FormEngine.calculate(q.calculation, _answers);
          if (calc != null) {
            _answers[q.name] = calc;
          }
        }
      }
    }
  }

  void _onAnswerChanged(String variableName, dynamic value) {
    setState(() {
      if (value == null || value == '') {
        _answers.remove(variableName);
      } else {
        _answers[variableName] = value;
      }
      _errors.remove(variableName);
      _runCalculations();
    });
  }

  Future<void> _captureGps(String variableName) async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled on this device.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        throw Exception('Location permission was not granted.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );
      final timestamp = DateTime.now().toIso8601String();
      setState(() {
        _capturedLocation = GeoLocation(
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          timestamp: timestamp,
        );
        _answers[variableName] = {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'timestamp': timestamp,
        };
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('GPS coordinates recorded (accuracy: ${position.accuracy.toStringAsFixed(1)}m)')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('GPS capture failed: $error'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  Future<void> _saveDraft() async {
    final user = await LocalDatabaseService.getCurrentUser();
    final deviceId = await LocalDatabaseService.getDeviceId();

    final draft = SubmissionRecord(
      id: 'draft_${DateTime.now().millisecondsSinceEpoch}',
      clientSubmissionId: _clientSubmissionId,
      projectId: widget.form.projectId,
      projectName: widget.form.projectName,
      formId: widget.form.id,
      formTitle: widget.form.title,
      formVersionId: widget.form.currentVersionId ?? 'v1',
      versionNumber: widget.form.currentVersion,
      enumeratorId: user?.id ?? 'enum_1',
      enumeratorName: user?.name ?? 'Enumerator',
      deviceId: deviceId,
      status: 'DRAFT',
      syncStatus: 'OFFLINE_SAVED',
      answers: _answers,
      geolocation: _capturedLocation,
      createdAt: DateTime.now().toIso8601String(),
      submittedAt: DateTime.now().toIso8601String(),
    );

    await LocalDatabaseService.saveDraft(draft);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Draft saved successfully.')),
      );
      Navigator.pop(context);
    }

    Future<void> _capturePhoto(String variableName) async {
      try {
        final image = await _imagePicker.pickImage(source: ImageSource.camera, imageQuality: 85);
        if (image == null) return;
        final bytes = await image.readAsBytes();
        _onAnswerChanged(variableName, {
          'fileName': image.name,
          'mimeType': 'image/jpeg',
          'dataUrl': 'data:image/jpeg;base64,${base64Encode(bytes)}',
        });
      } catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Photo capture failed: $error'), backgroundColor: Colors.redAccent),
          );
        }
      }
    }

    Future<void> _toggleAudio(String variableName) async {
      try {
        if (_isRecordingAudio) {
          final path = await _audioRecorder.stop();
          if (path != null) {
            final bytes = await File(path).readAsBytes();
            _onAnswerChanged(variableName, {
              'fileName': path.split(Platform.pathSeparator).last,
              'mimeType': 'audio/m4a',
              'dataUrl': 'data:audio/m4a;base64,${base64Encode(bytes)}',
            });
          }
          setState(() {
            _isRecordingAudio = false;
            _recordingQuestionName = null;
          });
          return;
        }

        if (!await _audioRecorder.hasPermission()) {
          throw Exception('Microphone permission was not granted.');
        }
        final path = '${Directory.systemTemp.path}/cmrg_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _audioRecorder.start(const RecordConfig(), path: path);
        setState(() {
          _isRecordingAudio = true;
          _recordingQuestionName = variableName;
        });
      } catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Audio capture failed: $error'), backgroundColor: Colors.redAccent),
          );
        }
      }
    }
  }

  Future<void> _finalizeSubmission() async {
    final newErrors = <String, String>{};

    for (final q in widget.form.questions) {
      if (['begin_group', 'end_group', 'begin_repeat', 'end_repeat', 'note'].contains(q.type)) {
        continue;
      }
      final isRelevant = FormEngine.evaluateRelevance(q.relevant, _answers);
      if (!isRelevant) continue;

      final val = _answers[q.name];
      final res = FormEngine.validate(q, val, _answers);
      if (!res.isValid && res.error != null) {
        newErrors[q.name] = res.error!;
      }
    }

    if (newErrors.isNotEmpty) {
      setState(() => _errors.addAll(newErrors));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please correct ${newErrors.length} validation errors before finalizing.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    final user = await LocalDatabaseService.getCurrentUser();
    final deviceId = await LocalDatabaseService.getDeviceId();

    final submission = SubmissionRecord(
      id: 'sub_client_${DateTime.now().millisecondsSinceEpoch}',
      clientSubmissionId: _clientSubmissionId,
      projectId: widget.form.projectId,
      projectName: widget.form.projectName,
      formId: widget.form.id,
      formTitle: widget.form.title,
      formVersionId: widget.form.currentVersionId ?? 'v1',
      versionNumber: widget.form.currentVersion,
      enumeratorId: user?.id ?? 'enum_1',
      enumeratorName: user?.name ?? 'Enumerator',
      deviceId: deviceId,
      status: 'COMPLETED',
      syncStatus: 'QUEUED',
      answers: _answers,
      geolocation: _capturedLocation,
      createdAt: DateTime.now().toIso8601String(),
      submittedAt: DateTime.now().toIso8601String(),
    );

    await LocalDatabaseService.saveCompleted(submission);
    await LocalDatabaseService.deleteDraft(_clientSubmissionId);

    if (mounted) {
      setState(() => _isSaving = false);
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF10B981)),
              SizedBox(width: 8),
              Text('Interview Finalized', style: TextStyle(color: Colors.white, fontSize: 18)),
            ],
          ),
          content: const Text(
            'The interview has been saved to your local offline queue. You can send it when you are connected to the network.',
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Dialog
                Navigator.pop(context); // Screen
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7)),
              child: const Text('Back to Terminal', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final visibleQuestions = widget.form.questions.where((q) {
      if (['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].contains(q.type)) {
        return false;
      }
      return FormEngine.evaluateRelevance(q.relevant, _answers);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.form.title, style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
            Text('Version v${widget.form.currentVersion}.0', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: _saveDraft,
            icon: const Icon(Icons.save_outlined, size: 18, color: Color(0xFF38BDF8)),
            label: const Text('Draft', style: TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: _isSaving
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)))
          : Column(
              children: [
                // Progress Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  color: const Color(0xFF1E293B),
                  child: Row(
                    children: [
                      const Icon(Icons.format_list_bulleted, size: 16, color: Color(0xFF64748B)),
                      const SizedBox(width: 8),
                      Text(
                        '${visibleQuestions.length} Active Questions',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                      ),
                      const Spacer(),
                      Text(
                        '${_answers.length} answered',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF38BDF8), fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),

                // Question Stream List
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: visibleQuestions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final question = visibleQuestions[index];
                      return _buildQuestionCard(question, index + 1);
                    },
                  ),
                ),

                // Bottom Finalize Bar
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    border: Border(top: BorderSide(color: Color(0xFF334155))),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _saveDraft,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Color(0xFF475569)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Save as Draft'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _finalizeSubmission,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0284C7),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Finalize Survey', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildQuestionCard(Question q, int displayNum) {
    final error = _errors[q.name];
    final value = _answers[q.name];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: error != null ? Colors.redAccent : const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$displayNum. ',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF38BDF8)),
              ),
              Expanded(
                child: Text(
                  q.label,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.white),
                ),
              ),
              if (q.required)
                const Text(' *', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          if (q.hint != null && q.hint!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(q.hint!, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
          ],
          const SizedBox(height: 12),

          // Question Input Widget based on type
          _buildInputControl(q, value),

          if (error != null) ...[
            const SizedBox(height: 8),
            Text(error, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
          ],
        ],
      ),
    );
  }

  Widget _buildInputControl(Question q, dynamic value) {
    switch (q.type) {
      case 'text':
      case 'long_text':
        return TextField(
          maxLines: q.type == 'long_text' ? 3 : 1,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter response...',
            hintStyle: const TextStyle(color: Color(0xFF64748B)),
            filled: true,
            fillColor: const Color(0xFF0F172A),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
          controller: TextEditingController(text: value?.toString() ?? '')
            ..selection = TextSelection.collapsed(offset: (value?.toString() ?? '').length),
          onChanged: (val) => _onAnswerChanged(q.name, val),
        );

      case 'integer':
      case 'decimal':
        return TextField(
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: '0',
            hintStyle: const TextStyle(color: Color(0xFF64748B)),
            filled: true,
            fillColor: const Color(0xFF0F172A),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
          controller: TextEditingController(text: value?.toString() ?? '')
            ..selection = TextSelection.collapsed(offset: (value?.toString() ?? '').length),
          onChanged: (val) => _onAnswerChanged(q.name, val),
        );

      case 'select_one':
      case 'yes_no':
        final choices = q.choices ?? (q.type == 'yes_no'
            ? [ChoiceOption(value: 'yes', label: 'Yes'), ChoiceOption(value: 'no', label: 'No')]
            : <ChoiceOption>[]);

        return Column(
          children: choices.map((c) {
            final isSelected = value?.toString() == c.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF0284C7).withOpacity(0.2) : const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF334155)),
              ),
              child: RadioListTile<String>(
                title: Text(c.label, style: const TextStyle(color: Colors.white, fontSize: 14)),
                value: c.value,
                groupValue: value?.toString(),
                activeColor: const Color(0xFF38BDF8),
                onChanged: (val) => _onAnswerChanged(q.name, val),
              ),
            );

      case 'select_multiple':
            final selected = (value is List ? value : <dynamic>[]).map((item) => item.toString()).toSet();
            return Column(
              children: (q.choices ?? []).map((c) => CheckboxListTile(
                title: Text(c.label, style: const TextStyle(color: Colors.white)),
                value: selected.contains(c.value),
                activeColor: const Color(0xFF38BDF8),
                onChanged: (checked) {
                  final next = {...selected};
                  if (checked == true) {
                    next.add(c.value);
                  } else {
                    next.remove(c.value);
                  }
                  _onAnswerChanged(q.name, next.toList());
                },
              )).toList(),
            );

      case 'dropdown':
            return DropdownButtonFormField<String>(
              value: value?.toString(),
              dropdownColor: const Color(0xFF1E293B),
              decoration: const InputDecoration(
                filled: true,
                fillColor: Color(0xFF0F172A),
                border: OutlineInputBorder(),
              ),
              items: (q.choices ?? []).map((c) => DropdownMenuItem(
                value: c.value,
                child: Text(c.label, style: const TextStyle(color: Colors.white)),
              )).toList(),
              onChanged: (next) => _onAnswerChanged(q.name, next),
            );

      case 'date':
            return ElevatedButton.icon(
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  firstDate: DateTime(1900),
                  lastDate: DateTime(2200),
                  initialDate: DateTime.tryParse(value?.toString() ?? '') ?? DateTime.now(),
                );
                if (picked != null) _onAnswerChanged(q.name, picked.toIso8601String().split('T').first);
              },
              icon: const Icon(Icons.calendar_today),
              label: Text(value?.toString() ?? 'Choose date'),
            );

      case 'time':
            return ElevatedButton.icon(
              onPressed: () async {
                final picked = await showTimePicker(context: context, initialTime: TimeOfDay.now());
                if (picked != null && mounted) _onAnswerChanged(q.name, picked.format(context));
              },
              icon: const Icon(Icons.schedule),
              label: Text(value?.toString() ?? 'Choose time'),
            );
          }).toList(),
        );

      case 'rating':
        final max = q.maxRating ?? 5;
        final currentRating = int.tryParse(value?.toString() ?? '0') ?? 0;
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(max, (i) {
            final star = i + 1;
            return IconButton(
              icon: Icon(
                star <= currentRating ? Icons.star : Icons.star_border,
                color: star <= currentRating ? Colors.amber : const Color(0xFF64748B),
                size: 32,
              ),
              onPressed: () => _onAnswerChanged(q.name, star),
            );
          }),
        );

      case 'geopoint':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_capturedLocation != null)
              Container(
                padding: const EdgeInsets.all(10),
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF065F46).withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF059669)),
                ),
                child: Text(
                  'Captured: Lat ${_capturedLocation!.latitude.toStringAsFixed(4)}, Lon ${_capturedLocation!.longitude.toStringAsFixed(4)} (±${_capturedLocation!.accuracy}m)',
                  style: const TextStyle(color: Color(0xFF34D399), fontSize: 12),
                ),
              ),
            ElevatedButton.icon(
              onPressed: () => _captureGps(q.name),
              icon: const Icon(Icons.my_location, size: 18),
              label: const Text('Record GPS Location'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        );

      case 'calculate':
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Row(
            children: [
              const Icon(Icons.calculate_outlined, color: Color(0xFF38BDF8), size: 20),
              const SizedBox(width: 8),
              Text(
                value != null ? value.toString() : 'Computed dynamically',
                style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ],
          ),
        );

      case 'image':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (value is Map && value['dataUrl'] != null)
              const Text('Photo captured and stored offline.', style: TextStyle(color: Color(0xFF34D399))),
            ElevatedButton.icon(
              onPressed: () => _capturePhoto(q.name),
              icon: const Icon(Icons.camera_alt),
              label: Text(value == null ? 'Take photo' : 'Retake photo'),
            ),
          ],
        );

      case 'audio':
        final recordingThisQuestion = _recordingQuestionName == q.name;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (value is Map && value['dataUrl'] != null)
              const Text('Audio recorded and stored offline.', style: TextStyle(color: Color(0xFF34D399))),
            ElevatedButton.icon(
              onPressed: () => _toggleAudio(q.name),
              icon: Icon(recordingThisQuestion ? Icons.stop : Icons.mic),
              label: Text(recordingThisQuestion ? 'Stop recording' : (value == null ? 'Record audio' : 'Record again')),
            ),
          ],
        );

      default:
        return TextField(
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter response...',
            hintStyle: const TextStyle(color: Color(0xFF64748B)),
            filled: true,
            fillColor: const Color(0xFF0F172A),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
          onChanged: (val) => _onAnswerChanged(q.name, val),
        );
    }
  }
}
