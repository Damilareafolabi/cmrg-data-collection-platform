import { Question, ChoiceOption } from './types';

/**
 * Safely evaluates a skip logic (relevance) expression against current answers.
 * Supported syntax:
 * - ${var_name} = 'val' or ${var_name} == 'val'
 * - ${var_name} != 'val'
 * - ${var_name} > num, >= num, < num, <= num
 * - selected(${var_name}, 'val')
 * - and / or combinations: ${a} = 'yes' and ${b} > 10
 */
export function evaluateRelevance(relevantExpr: string | undefined, answers: Record<string, any>): boolean {
  if (!relevantExpr || relevantExpr.trim() === '') return true;

  try {
    let expr = relevantExpr.trim();

    // Handle `selected(${var}, 'val')`
    expr = expr.replace(/selected\s*\(\s*\${([a-zA-Z0-9_]+)}\s*,\s*['"]([^'"]+)['"]\s*\)/g, (_, varName, val) => {
      const answerVal = answers[varName];
      if (Array.isArray(answerVal)) {
        return answerVal.includes(val) ? 'true' : 'false';
      }
      if (typeof answerVal === 'string') {
        const parts = answerVal.split(/[\s,]+/);
        return parts.includes(val) ? 'true' : 'false';
      }
      return 'false';
    });

    // Replace variables ${varName} with JSON representation of answer
    expr = expr.replace(/\${([a-zA-Z0-9_]+)}/g, (_, varName) => {
      const val = answers[varName];
      if (val === undefined || val === null || val === '') {
        return '""';
      }
      if (typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
      }
      return JSON.stringify(String(val));
    });

    // Normalize single `=` to `===` unless part of `<=`, `>=`, `!=`
    // Convert SQL/ODK `and`, `or`, `not` to JS `&&`, `||`, `!`
    let jsExpr = expr
      .replace(/(?<![<>=!])=(?!=)/g, '===')
      .replace(/\band\b/gi, '&&')
      .replace(/\bor\b/gi, '||')
      .replace(/\bnot\b/gi, '!')
      .replace(/\bnull\s*===\s*null\b/g, 'true');

    // Security check: Only allow safe characters
    if (!/^[a-zA-Z0-9_\s'"()=!><&|.,+-/*?:]*$/.test(jsExpr)) {
      return true;
    }

    // Evaluate
    // eslint-disable-next-line no-new-func
    const result = new Function(`return Boolean(${jsExpr});`)();
    return Boolean(result);
  } catch (err) {
    console.warn('Relevance evaluation error for expression:', relevantExpr, err);
    return true; // Default to showing question on evaluation error
  }
}

/**
 * Evaluates a calculated field expression.
 * E.g. "${data_spend} * 12" or "${quantity} * ${price}"
 */
export function evaluateCalculation(calculationExpr: string | undefined, answers: Record<string, any>): any {
  if (!calculationExpr || calculationExpr.trim() === '') return undefined;

  try {
    let expr = calculationExpr.trim();

    expr = expr.replace(/\${([a-zA-Z0-9_]+)}/g, (_, varName) => {
      const val = answers[varName];
      if (val === undefined || val === null || val === '') {
        return '0';
      }
      const num = Number(val);
      if (!isNaN(num)) {
        return String(num);
      }
      return JSON.stringify(String(val));
    });

    // Security check
    if (!/^[0-9_\s'"()=!><&|.,+-/*?:%]*$/.test(expr)) {
      return undefined;
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${expr});`)();
    return result;
  } catch (err) {
    console.warn('Calculation evaluation error:', calculationExpr, err);
    return undefined;
  }
}

/**
 * Evaluates a constraint expression against a given value and optional context answers.
 * E.g. ". >= 18 and . <= 65" or ". > 0"
 */
export function validateConstraint(
  constraintExpr: string | undefined,
  value: any,
  answers: Record<string, any> = {}
): boolean {
  if (!constraintExpr || constraintExpr.trim() === '') return true;
  if (value === undefined || value === null || value === '') return true;

  try {
    let expr = constraintExpr.trim();
    const valStr = typeof value === 'number' ? String(value) : JSON.stringify(String(value));
    expr = expr.replace(/(?<![a-zA-Z0-9_])\.(?![a-zA-Z0-9_])/g, valStr);

    expr = expr.replace(/\${([a-zA-Z0-9_]+)}/g, (_, varName) => {
      const val = answers[varName];
      if (val === undefined || val === null || val === '') return 'null';
      if (typeof val === 'number') return String(val);
      return JSON.stringify(String(val));
    });

    const jsExpr = expr
      .replace(/(?<![<>=!])=(?!=)/g, '===')
      .replace(/\band\b/gi, '&&')
      .replace(/\bor\b/gi, '||')
      .replace(/\bnot\b/gi, '!');

    if (!/^[a-zA-Z0-9_\s'"()=!><&|.,+-/*?:]*$/.test(jsExpr)) {
      return true;
    }

    // eslint-disable-next-line no-new-func
    return Boolean(new Function(`return Boolean(${jsExpr});`)());
  } catch (err) {
    console.warn('Constraint check error:', err);
    return true;
  }
}

/**
 * Validates a single question answer against required status and constraints.
 */
export function validateQuestion(
  question: Question,
  value: any,
  answers: Record<string, any>
): { valid: boolean; error?: string } {
  // Check if relevant first
  const isRelevant = evaluateRelevance(question.relevant, answers);
  if (!isRelevant) {
    return { valid: true };
  }

  // Required check
  if (question.required) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return {
        valid: false,
        error: `${question.label || question.name} is required.`
      };
    }
  }

  // If value is empty and not required, valid
  if (value === undefined || value === null || value === '') {
    return { valid: true };
  }

  // Type-specific basic validation
  if (question.type === 'integer') {
    const num = Number(value);
    if (!Number.isInteger(num)) {
      return { valid: false, error: 'Please enter a valid whole number.' };
    }
  } else if (question.type === 'decimal') {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Please enter a valid decimal number.' };
    }
  } else if (question.type === 'rating') {
    const num = Number(value);
    const max = question.maxRating || 5;
    if (isNaN(num) || num < 1 || num > max) {
      return { valid: false, error: `Please provide a rating between 1 and ${max}.` };
    }
  } else if (question.type === 'ranking') {
    if (!Array.isArray(value) || value.length === 0) {
      return { valid: false, error: 'Please arrange all items in order of ranking.' };
    }
  } else if (question.type === 'geopoint') {
    if (typeof value === 'object' && value !== null) {
      if (typeof value.latitude !== 'number' || typeof value.longitude !== 'number') {
        return { valid: false, error: 'Valid GPS coordinates (latitude & longitude) are required.' };
      }
    }
  }

  // Constraint check if provided
  if (question.constraint && question.constraint.trim() !== '') {
    const passed = validateConstraint(question.constraint, value, answers);
    if (!passed) {
      return {
        valid: false,
        error: question.constraintMessage || `Value does not meet constraint criteria: ${question.constraint}`
      };
    }
  }

  return { valid: true };
}

/**
 * Recomputes all calculated fields in order based on current answers.
 */
export function recalculateForm(questions: Question[], answers: Record<string, any>): Record<string, any> {
  const updated = { ...answers };
  for (const q of questions) {
    if (q.type === 'calculate' || q.calculation) {
      const isRelevant = evaluateRelevance(q.relevant, updated);
      if (isRelevant && q.calculation) {
        const calcVal = evaluateCalculation(q.calculation, updated);
        if (calcVal !== undefined && !isNaN(calcVal)) {
          updated[q.name] = calcVal;
        }
      }
    }
  }
  return updated;
}
