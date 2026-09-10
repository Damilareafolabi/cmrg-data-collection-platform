import 'dart:convert';

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? deviceId;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.deviceId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'ENUMERATOR',
      deviceId: json['deviceId'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'deviceId': deviceId,
  };
}

class ChoiceOption {
  final String value;
  final String label;

  ChoiceOption({required this.value, required this.label});

  factory ChoiceOption.fromJson(Map<String, dynamic> json) {
    return ChoiceOption(
      value: (json['value'] ?? '').toString(),
      label: (json['label'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {'value': value, 'label': label};
}

class Question {
  final String id;
  final String name;
  final String label;
  final String? hint;
  final String type;
  final bool required;
  final bool readOnly;
  final List<ChoiceOption>? choices;
  final String? relevant;
  final String? constraint;
  final String? constraintMessage;
  final String? calculation;
  final String? appearance;
  final int? maxRating;
  final int order;

  Question({
    required this.id,
    required this.name,
    required this.label,
    this.hint,
    required this.type,
    this.required = false,
    this.readOnly = false,
    this.choices,
    this.relevant,
    this.constraint,
    this.constraintMessage,
    this.calculation,
    this.appearance,
    this.maxRating,
    required this.order,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    var rawChoices = json['choices'] as List?;
    List<ChoiceOption>? parsedChoices;
    if (rawChoices != null) {
      parsedChoices = rawChoices.map((c) => ChoiceOption.fromJson(c)).toList();
    }

    return Question(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      label: json['label'] ?? '',
      hint: json['hint'],
      type: json['type'] ?? 'text',
      required: json['required'] == true,
      readOnly: json['readOnly'] == true,
      choices: parsedChoices,
      relevant: json['relevant'],
      constraint: json['constraint'],
      constraintMessage: json['constraintMessage'],
      calculation: json['calculation'],
      appearance: json['appearance'],
      maxRating: json['maxRating'],
      order: json['order'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'label': label,
    'hint': hint,
    'type': type,
    'required': required,
    'readOnly': readOnly,
    'choices': choices?.map((c) => c.toJson()).toList(),
    'relevant': relevant,
    'constraint': constraint,
    'constraintMessage': constraintMessage,
    'calculation': calculation,
    'appearance': appearance,
    'maxRating': maxRating,
    'order': order,
  };
}

class FormDefinition {
  final String id;
  final String projectId;
  final String? projectName;
  final String title;
  final String description;
  final int currentVersion;
  final String? currentVersionId;
  final List<Question> questions;
  final Map<String, dynamic> settings;

  FormDefinition({
    required this.id,
    required this.projectId,
    this.projectName,
    required this.title,
    required this.description,
    required this.currentVersion,
    this.currentVersionId,
    required this.questions,
    required this.settings,
  });

  factory FormDefinition.fromJson(Map<String, dynamic> json) {
    var rawQuestions = json['questions'] as List? ?? [];
    return FormDefinition(
      id: json['id'] ?? '',
      projectId: json['projectId'] ?? '',
      projectName: json['projectName'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      currentVersion: json['currentVersion'] ?? 1,
      currentVersionId: json['currentVersionId'],
      questions: rawQuestions.map((q) => Question.fromJson(q)).toList(),
      settings: json['settings'] is Map<String, dynamic> ? json['settings'] : {},
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'projectId': projectId,
    'projectName': projectName,
    'title': title,
    'description': description,
    'currentVersion': currentVersion,
    'currentVersionId': currentVersionId,
    'questions': questions.map((q) => q.toJson()).toList(),
    'settings': settings,
  };
}

class GeoLocation {
  final double latitude;
  final double longitude;
  final double? accuracy;
  final String timestamp;

  GeoLocation({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    required this.timestamp,
  });

  factory GeoLocation.fromJson(Map<String, dynamic> json) {
    return GeoLocation(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: json['accuracy'] != null ? (json['accuracy'] as num).toDouble() : null,
      timestamp: json['timestamp'] ?? DateTime.now().toIso8601String(),
    );
  }

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    'accuracy': accuracy,
    'timestamp': timestamp,
  };
}

class SubmissionRecord {
  final String id;
  final String clientSubmissionId;
  final String projectId;
  final String? projectName;
  final String formId;
  final String formTitle;
  final String formVersionId;
  final int versionNumber;
  final String enumeratorId;
  final String enumeratorName;
  final String deviceId;
  final String status; // 'DRAFT', 'COMPLETED', 'SYNCED'
  final String syncStatus; // 'OFFLINE_SAVED', 'QUEUED', 'SYNCED', 'SYNC_FAILED'
  final Map<String, dynamic> answers;
  final GeoLocation? geolocation;
  final String createdAt;
  final String submittedAt;

  SubmissionRecord({
    required this.id,
    required this.clientSubmissionId,
    required this.projectId,
    this.projectName,
    required this.formId,
    required this.formTitle,
    required this.formVersionId,
    required this.versionNumber,
    required this.enumeratorId,
    required this.enumeratorName,
    required this.deviceId,
    required this.status,
    required this.syncStatus,
    required this.answers,
    this.geolocation,
    required this.createdAt,
    required this.submittedAt,
  });

  factory SubmissionRecord.fromJson(Map<String, dynamic> json) {
    return SubmissionRecord(
      id: json['id'] ?? '',
      clientSubmissionId: json['clientSubmissionId'] ?? '',
      projectId: json['projectId'] ?? '',
      projectName: json['projectName'],
      formId: json['formId'] ?? '',
      formTitle: json['formTitle'] ?? '',
      formVersionId: json['formVersionId'] ?? '',
      versionNumber: json['versionNumber'] ?? 1,
      enumeratorId: json['enumeratorId'] ?? '',
      enumeratorName: json['enumeratorName'] ?? '',
      deviceId: json['deviceId'] ?? '',
      status: json['status'] ?? 'COMPLETED',
      syncStatus: json['syncStatus'] ?? 'SYNCED',
      answers: json['answers'] is Map<String, dynamic> ? json['answers'] : {},
      geolocation: json['geolocation'] != null ? GeoLocation.fromJson(json['geolocation']) : null,
      createdAt: json['createdAt'] ?? '',
      submittedAt: json['submittedAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'clientSubmissionId': clientSubmissionId,
    'projectId': projectId,
    'projectName': projectName,
    'formId': formId,
    'formTitle': formTitle,
    'formVersionId': formVersionId,
    'versionNumber': versionNumber,
    'enumeratorId': enumeratorId,
    'enumeratorName': enumeratorName,
    'deviceId': deviceId,
    'status': status,
    'syncStatus': syncStatus,
    'answers': answers,
    'geolocation': geolocation?.toJson(),
    'createdAt': createdAt,
    'submittedAt': submittedAt,
  };
}
