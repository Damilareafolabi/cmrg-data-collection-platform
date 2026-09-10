import '../models/models.dart';

class FormEngine {
  /// Evaluates skip logic expression against the current answers
  /// E.g. "${owns_smartphone} = 'yes'"
  static bool evaluateRelevance(String? relevantExpr, Map<String, dynamic> answers) {
    if (relevantExpr == null || relevantExpr.trim().isEmpty) return true;

    try {
      String expr = relevantExpr.trim();

      // Handle simple equality: ${var} = 'val' or ${var} == 'val'
      final equalityRegex = RegExp(r"\$\{([a-zA-Z0-9_]+)\}\s*==?\s*'([^']*)'");
      final match = equalityRegex.firstMatch(expr);
      if (match != null) {
        final varName = match.group(1);
        final targetVal = match.group(2);
        final answerVal = answers[varName]?.toString();
        return answerVal == targetVal;
      }

      // Handle inequality: ${var} != 'val'
      final inequalityRegex = RegExp(r"\$\{([a-zA-Z0-9_]+)\}\s*!=\s*'([^']*)'");
      final ineqMatch = inequalityRegex.firstMatch(expr);
      if (ineqMatch != null) {
        final varName = ineqMatch.group(1);
        final targetVal = ineqMatch.group(2);
        final answerVal = answers[varName]?.toString();
        return answerVal != targetVal;
      }

      // Handle numeric comparisons: ${var} > 10, >= 10, < 10, <= 10
      final numRegex = RegExp(r"\$\{([a-zA-Z0-9_]+)\}\s*([><]=?)\s*([0-9.]+)");
      final numMatch = numRegex.firstMatch(expr);
      if (numMatch != null) {
        final varName = numMatch.group(1);
        final op = numMatch.group(2);
        final targetNum = double.tryParse(numMatch.group(3) ?? '') ?? 0;
        final answerNum = double.tryParse(answers[varName]?.toString() ?? '') ?? 0;

        switch (op) {
          case '>': return answerNum > targetNum;
          case '>=': return answerNum >= targetNum;
          case '<': return answerNum < targetNum;
          case '<=': return answerNum <= targetNum;
        }
      }

      // Default safe fallback: question is visible
      return true;
    } catch (e) {
      return true;
    }
  }

  /// Validates a single question answer
  static ValidationResult validate(Question question, dynamic value, Map<String, dynamic> answers) {
    final isRelevant = evaluateRelevance(question.relevant, answers);
    if (!isRelevant) return ValidationResult(isValid: true);

    // Required check
    if (question.required) {
      if (value == null || value.toString().trim().isEmpty) {
        return ValidationResult(isValid: false, error: '${question.label} is required.');
      }
      if (value is List && value.isEmpty) {
        return ValidationResult(isValid: false, error: '${question.label} is required.');
      }
    }

    if (value == null || value.toString().trim().isEmpty) {
      return ValidationResult(isValid: true);
    }

    // Type constraints
    if (question.type == 'integer') {
      final num = int.tryParse(value.toString());
      if (num == null) {
        return ValidationResult(isValid: false, error: 'Please enter a valid whole number.');
      }
    } else if (question.type == 'decimal') {
      final num = double.tryParse(value.toString());
      if (num == null) {
        return ValidationResult(isValid: false, error: 'Please enter a valid decimal number.');
      }
    } else if (question.type == 'rating') {
      final num = int.tryParse(value.toString()) ?? 0;
      final max = question.maxRating ?? 5;
      if (num < 1 || num > max) {
        return ValidationResult(isValid: false, error: 'Rating must be between 1 and $max.');
      }
    }

    // Constraint expression check (e.g. ". >= 0 and . <= 120")
    if (question.constraint != null && question.constraint!.isNotEmpty) {
      final constraint = question.constraint!.trim();
      final num = double.tryParse(value.toString());
      if (num != null) {
        if (constraint.contains('>= 0') && num < 0) {
          return ValidationResult(
            isValid: false,
            error: question.constraintMessage ?? 'Value cannot be negative.',
          );
        }
        if (constraint.contains('<= 120') && num > 120) {
          return ValidationResult(
            isValid: false,
            error: question.constraintMessage ?? 'Age must be 120 or below.',
          );
        }
      }
    }

    return ValidationResult(isValid: true);
  }

  /// Calculates derived value
  static dynamic calculate(String? calcExpr, Map<String, dynamic> answers) {
    if (calcExpr == null || calcExpr.trim().isEmpty) return null;

    try {
      // Handle simple multiplication: ${var} * 12
      final multRegex = RegExp(r"\$\{([a-zA-Z0-9_]+)\}\s*\*\s*([0-9.]+)");
      final match = multRegex.firstMatch(calcExpr);
      if (match != null) {
        final varName = match.group(1);
        final factor = double.tryParse(match.group(2) ?? '1') ?? 1;
        final baseVal = double.tryParse(answers[varName]?.toString() ?? '0') ?? 0;
        return baseVal * factor;
      }

      // Handle addition: ${var1} + ${var2}
      final addRegex = RegExp(r"\$\{([a-zA-Z0-9_]+)\}\s*\+\s*\$\{([a-zA-Z0-9_]+)\}");
      final addMatch = addRegex.firstMatch(calcExpr);
      if (addMatch != null) {
        final val1 = double.tryParse(answers[addMatch.group(1)]?.toString() ?? '0') ?? 0;
        final val2 = double.tryParse(answers[addMatch.group(2)]?.toString() ?? '0') ?? 0;
        return val1 + val2;
      }
    } catch (_) {}

    return null;
  }
}

class ValidationResult {
  final bool isValid;
  final String? error;

  ValidationResult({required this.isValid, this.error});
}
