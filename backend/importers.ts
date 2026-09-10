import * as XLSX from 'xlsx';
import { Question, QuestionType, ChoiceOption, FormImportResult, ImportWarning } from '../shared/types';

const SUPPORTED_QUESTION_TYPES = new Set<QuestionType>([
  'text', 'long_text', 'note', 'integer', 'decimal', 'select_one',
  'select_multiple', 'dropdown', 'yes_no', 'date', 'time', 'datetime',
  'calculate', 'geopoint', 'image', 'audio', 'signature', 'rating',
  'ranking', 'begin_group', 'end_group', 'begin_repeat', 'end_repeat'
]);

const STRUCTURAL_TYPES = new Set<QuestionType>([
  'begin_group', 'end_group', 'begin_repeat', 'end_repeat'
]);

/**
 * Sanitizes text to a valid, clean variable name (e.g. "What is your age?" -> "age" or "q1_age")
 */
export function sanitizeVariableName(raw: string, fallbackPrefix = 'q', index = 1): string {
  if (!raw || raw.trim() === '') return `${fallbackPrefix}_${index}`;
  let clean = raw
    .toLowerCase()
    .trim()
    .replace(/^[^a-zA-Z_]+/, '') // must start with letter or underscore
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .slice(0, 32);

  if (!clean || clean.length === 0) {
    clean = `${fallbackPrefix}_${index}`;
  }
  return clean;
}

function appendDuplicateWarnings(questions: Question[], warnings: ImportWarning[]) {
  const seen = new Map<string, number>();
  for (const q of questions) {
    if (!q.name) continue;
    if (seen.has(q.name)) {
      const duplicateIndex = seen.get(q.name)! + 1;
      warnings.push({
        questionName: q.name,
        severity: 'warning',
        message: `Duplicate variable name "${q.name}" detected. The earlier instance will be kept, and later duplicates should be renamed before publishing.`,
        suggestedFix: `Rename question "${q.name}" to a unique variable name.`
      });
      seen.set(q.name, duplicateIndex);
    } else {
      seen.set(q.name, 1);
    }
  }
}

/**
 * Performs the checks that must happen after every importer. Keeping these
 * checks at the internal-model boundary prevents format-specific parsers from
 * silently dropping information or producing forms that cannot be published.
 */
export function validateImportedResult(result: FormImportResult): FormImportResult {
  const warnings = [...(result.warnings || [])];
  const names = new Set<string>();
  const choiceLists = new Set<string>(
    Array.isArray(result.rawSummary?.choiceListNames)
      ? result.rawSummary.choiceListNames
      : result.questions
        .map(question => question.choiceListName)
        .filter((name): name is string => Boolean(name))
  );
  const definedNames = new Set(
    result.questions
      .map(question => question.name)
      .filter(Boolean)
  );
  const groupStack: QuestionType[] = [];

  result.questions.forEach((question, index) => {
    const location = question.name ? ` "${question.name}"` : ` at row ${index + 1}`;

    if (!question.label?.trim() && !STRUCTURAL_TYPES.has(question.type)) {
      warnings.push({
        questionIndex: index + 1,
        questionName: question.name,
        severity: 'error',
        message: `Question${location} is missing a label.`,
        suggestedFix: 'Add a human-readable label before publishing.'
      });
    }

    if (!SUPPORTED_QUESTION_TYPES.has(question.type)) {
      warnings.push({
        questionIndex: index + 1,
        questionName: question.name,
        severity: 'error',
        message: `Question${location} uses unsupported type "${question.type}".`,
        suggestedFix: 'Change it to a supported CMRG question type in the builder.'
      });
    }

    if (question.name) {
      if (names.has(question.name)) {
        warnings.push({
          questionIndex: index + 1,
          questionName: question.name,
          severity: 'error',
          message: `Duplicate variable name "${question.name}" detected.`,
          suggestedFix: 'Rename one of the questions so every variable is unique.'
        });
      }
      names.add(question.name);
    }

    if ((question.type === 'select_one' || question.type === 'select_multiple' || question.type === 'dropdown')
      && question.choiceListName && !choiceLists.has(question.choiceListName)) {
      warnings.push({
        questionIndex: index + 1,
        questionName: question.name,
        severity: 'error',
        message: `Choice list "${question.choiceListName}" is referenced but was not imported.`,
        suggestedFix: 'Add the missing list to the choices sheet or define options in the builder.'
      });
    }

    if (question.relevant && /\$\{([^}]+)\}/g.test(question.relevant)) {
      const refs = [...question.relevant.matchAll(/\$\{([^}]+)\}/g)];
      refs.forEach(ref => {
        if (!definedNames.has(ref[1])) {
          warnings.push({
            questionIndex: index + 1,
            questionName: question.name,
            severity: 'warning',
            message: `Relevance rule references unknown variable "${ref[1]}".`,
            suggestedFix: 'Check the variable name or add the referenced question.'
          });
        }
      });
    }

    if (question.calculation && /\$\{([^}]+)\}/g.test(question.calculation)) {
      const refs = [...question.calculation.matchAll(/\$\{([^}]+)\}/g)];
      refs.forEach(ref => {
        if (!definedNames.has(ref[1])) {
          warnings.push({
            questionIndex: index + 1,
            questionName: question.name,
            severity: 'warning',
            message: `Calculation references unknown variable "${ref[1]}".`,
            suggestedFix: 'Check the calculation references before publishing.'
          });
        }
      });
    }

    if (question.type === 'begin_group' || question.type === 'begin_repeat') {
      groupStack.push(question.type);
    } else if (question.type === 'end_group' || question.type === 'end_repeat') {
      const expected = question.type === 'end_group' ? 'begin_group' : 'begin_repeat';
      if (groupStack.pop() !== expected) {
        warnings.push({
          questionIndex: index + 1,
          questionName: question.name,
          severity: 'error',
          message: `Malformed ${question.type === 'end_group' ? 'group' : 'repeat'} boundary.`,
          suggestedFix: `Add the matching ${expected} before this row.`
        });
      }
    }
  });

  groupStack.forEach(openType => {
    warnings.push({
      severity: 'error',
      message: `Unclosed ${openType === 'begin_group' ? 'group' : 'repeat'} detected.`,
      suggestedFix: `Add the matching ${openType === 'begin_group' ? 'end_group' : 'end_repeat'} row.`
    });
  });

  return {
    ...result,
    warnings
  };
}

/**
 * Parse an XLSForm workbook (detecting survey, choices, settings sheets)
 */
export function parseXLSForm(workbook: XLSX.WorkBook, fileName: string): FormImportResult {
  const sheetNames = workbook.SheetNames.map(s => s.trim().toLowerCase());
  const surveySheetName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'survey');
  const choicesSheetName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'choices');
  const settingsSheetName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'settings');

  if (!surveySheetName) {
    throw new Error('Missing "survey" sheet in XLSForm');
  }

  const surveyRows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[surveySheetName], { defval: '' });
  const choicesRows = choicesSheetName
    ? XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[choicesSheetName], { defval: '' })
    : [];
  const settingsRows = settingsSheetName
    ? XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[settingsSheetName], { defval: '' })
    : [];

  // Index choices by list_name
  const choiceMap: Record<string, ChoiceOption[]> = {};
  for (const c of choicesRows) {
    const listName = (c['list_name'] || c['list name'] || '').toString().trim();
    const name = (c['name'] || c['value'] || '').toString().trim();
    const label = (c['label'] || c['label::English'] || name).toString().trim();
    if (listName && name) {
      if (!choiceMap[listName]) choiceMap[listName] = [];
      choiceMap[listName].push({
        value: name,
        label: label || name
      });
    }
  }

  // Parse Settings
  let detectedFormTitle = 'Imported XLSForm Questionnaire';
  if (settingsRows.length > 0) {
    const s = settingsRows[0];
    detectedFormTitle = s['form_title'] || s['title'] || detectedFormTitle;
  }

  const questions: Question[] = [];
  const warnings: ImportWarning[] = [];
  let sectionsCount = 0;
  let skipConditionsCount = 0;
  let calculationsCount = 0;
  let currentGroup: string | undefined = undefined;

  let order = 1;
  for (let idx = 0; idx < surveyRows.length; idx++) {
    const row = surveyRows[idx];
    const rawType = (row['type'] || '').toString().trim();
    const rawName = (row['name'] || '').toString().trim();
    const rawLabel = (row['label'] || row['label::English'] || rawName).toString().trim();
    const hint = (row['hint'] || row['hint::English'] || '').toString().trim();
    const requiredVal = (row['required'] || '').toString().toLowerCase().trim();
    const isRequired = requiredVal === 'yes' || requiredVal === 'true' || requiredVal === '1';
    const relevant = (row['relevant'] || '').toString().trim();
    const constraint = (row['constraint'] || '').toString().trim();
    const constraintMessage = (row['constraint_message'] || '').toString().trim();
    const calculation = (row['calculation'] || '').toString().trim();
    const appearance = (row['appearance'] || '').toString().trim();

    if (!rawType && !rawName) continue; // Skip blank rows

    const baseType = rawType.split(/\s+/, 1)[0] as QuestionType;
    if (rawType && !SUPPORTED_QUESTION_TYPES.has(baseType) && !rawType.startsWith('select_one ') && !rawType.startsWith('select_multiple ')) {
      warnings.push({
        questionIndex: idx + 1,
        questionName: rawName || undefined,
        severity: 'error',
        message: `Unsupported XLSForm type "${rawType}" could not be interpreted exactly.`,
        suggestedFix: 'Change the type to a supported CMRG type before publishing.'
      });
    }

    // Grouping
    if (rawType === 'begin_group') {
      sectionsCount++;
      currentGroup = rawName || `group_${order}`;
      questions.push({
        id: `q_${Date.now()}_${idx}`,
        name: rawName || `group_${order}`,
        label: rawLabel || 'Group Section',
        type: 'begin_group',
        required: false,
        order: order++
      });
      continue;
    }
    if (rawType === 'end_group') {
      currentGroup = undefined;
      questions.push({
        id: `q_${Date.now()}_${idx}`,
        name: rawName || `end_group_${order}`,
        label: 'End Group',
        type: 'end_group',
        required: false,
        order: order++
      });
      continue;
    }
    if (rawType === 'begin_repeat') {
      sectionsCount++;
      questions.push({
        id: `q_${Date.now()}_${idx}`,
        name: rawName || `repeat_${order}`,
        label: rawLabel || 'Repeat Section',
        type: 'begin_repeat',
        required: false,
        order: order++
      });
      continue;
    }
    if (rawType === 'end_repeat') {
      questions.push({
        id: `q_${Date.now()}_${idx}`,
        name: rawName || `end_repeat_${order}`,
        label: 'End Repeat',
        type: 'end_repeat',
        required: false,
        order: order++
      });
      continue;
    }

    // Map question types
    let qType: QuestionType = 'text';
    let choices: ChoiceOption[] | undefined = undefined;
    let choiceListName: string | undefined = undefined;

    if (rawType.startsWith('select_one ')) {
      qType = 'select_one';
      choiceListName = rawType.replace('select_one ', '').trim();
      choices = choiceMap[choiceListName] || [];
      if (choices.length === 0) {
        warnings.push({
          questionIndex: idx + 1,
          questionName: rawName,
          severity: 'warning',
          message: `Choice list "${choiceListName}" not found in choices sheet for question "${rawName}".`,
          suggestedFix: 'Add choices in the question editor.'
        });
      }
    } else if (rawType.startsWith('select_multiple ')) {
      qType = 'select_multiple';
      choiceListName = rawType.replace('select_multiple ', '').trim();
      choices = choiceMap[choiceListName] || [];
      if (choices.length === 0) {
        warnings.push({
          questionIndex: idx + 1,
          questionName: rawName,
          severity: 'warning',
          message: `Choice list "${choiceListName}" not found in choices sheet for question "${rawName}".`
        });
      }
    } else if (rawType === 'integer') {
      qType = 'integer';
    } else if (rawType === 'decimal') {
      qType = 'decimal';
    } else if (rawType === 'note') {
      qType = 'note';
    } else if (rawType === 'date') {
      qType = 'date';
    } else if (rawType === 'time') {
      qType = 'time';
    } else if (rawType === 'datetime') {
      qType = 'datetime';
    } else if (rawType === 'geopoint') {
      qType = 'geopoint';
    } else if (rawType === 'image') {
      qType = 'image';
    } else if (rawType === 'audio') {
      qType = 'audio';
    } else if (rawType === 'signature') {
      qType = 'signature';
    } else if (rawType === 'rating') {
      qType = 'rating';
    } else if (rawType === 'ranking') {
      qType = 'ranking';
    } else if (rawType === 'long_text' || rawType === 'text_multiline') {
      qType = 'long_text';
    } else if (rawType === 'calculate') {
      qType = 'calculate';
      calculationsCount++;
    } else if (rawType === 'yes_no') {
      qType = 'yes_no';
      choices = [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ];
    }

    if (relevant) skipConditionsCount++;
    if (calculation && qType !== 'calculate') calculationsCount++;

    const variableName = rawName || sanitizeVariableName(rawLabel, 'q', order);
    if (!rawName) {
      warnings.push({
        questionIndex: idx + 1,
        questionName: variableName,
        severity: 'info',
        message: `Generated variable name "${variableName}" from question label.`
      });
    }

    questions.push({
      id: `q_${Date.now()}_${idx}`,
      name: variableName,
      label: rawLabel || variableName,
      hint: hint || undefined,
      type: qType,
      required: isRequired,
      choices: choices,
      choiceListName: choiceListName,
      relevant: relevant || undefined,
      constraint: constraint || undefined,
      constraintMessage: constraintMessage || undefined,
      calculation: calculation || undefined,
      appearance: appearance || undefined,
      order: order++,
      groupId: currentGroup
    });
  }

  appendDuplicateWarnings(questions, warnings);

  return {
    fileName,
    fileType: 'XLSForm',
    detectedFormTitle,
    questionsCount: questions.filter(q => !['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].includes(q.type)).length,
    sectionsCount,
    choiceListsCount: Object.keys(choiceMap).length,
    skipConditionsCount,
    calculationsCount,
    questions,
    warnings,
    rawSummary: {
      sheetNames: workbook.SheetNames,
      choiceListNames: Object.keys(choiceMap),
      settings: settingsRows[0] || {},
      mediaFields: questions.filter(q => ['image', 'audio', 'signature'].includes(q.type)).map(q => q.name),
      gpsFields: questions.filter(q => q.type === 'geopoint').map(q => q.name)
    }
  };
}

/**
 * Parses ordinary Excel questionnaires (e.g. columns No, Question, Type, Options, Skip, etc.)
 */
export function parseOrdinaryExcelQuestionnaire(workbook: XLSX.WorkBook, fileName: string): FormImportResult {
  const firstSheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[firstSheetName], { defval: '' });

  if (rows.length === 0) {
    throw new Error('Excel sheet is empty');
  }

  // Find column headers mapping
  const sampleRow = rows[0];
  const keys = Object.keys(sampleRow);

  const findKey = (patterns: string[]) => {
    return keys.find(k => patterns.some(p => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p.toLowerCase())));
  };

  const numberKey = findKey(['no', 'num', 'qid', 'item', 'sn']);
  const questionKey = findKey(['question', 'questiontext', 'label', 'description', 'itemtext', 'title', 'prompt']);
  const typeKey = findKey(['type', 'questiontype', 'responsetype', 'format', 'input']);
  const optionsKey = findKey(['options', 'choices', 'answers', 'responseoptions', 'values', 'codes']);
  const hintKey = findKey(['hint', 'instruction', 'guide', 'note']);
  const skipKey = findKey(['skip', 'skiplogic', 'relevance', 'condition', 'filter']);
  const requiredKey = findKey(['required', 'mandatory', 'compulsory']);
  const sectionKey = findKey(['section', 'category', 'group', 'module']);

  const questions: Question[] = [];
  const warnings: ImportWarning[] = [];
  let sectionsCount = 0;
  let skipConditionsCount = 0;
  let calculationsCount = 0;
  let choiceListsDetected = 0;
  let lastSection = '';

  let order = 1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const qNum = numberKey ? String(row[numberKey]).trim() : '';
    const qText = questionKey ? String(row[questionKey]).trim() : '';
    const qTypeRaw = typeKey ? String(row[typeKey]).toLowerCase().trim() : '';
    const qOptions = optionsKey ? String(row[optionsKey]).trim() : '';
    const qHint = hintKey ? String(row[hintKey]).trim() : '';
    const qSkip = skipKey ? String(row[skipKey]).trim() : '';
    const qRequired = requiredKey ? String(row[requiredKey]).toLowerCase().trim() : '';
    const qSection = sectionKey ? String(row[sectionKey]).trim() : '';

    if (!qText && !qOptions && !qNum) continue;

    // Detect section headers
    if (qSection && qSection !== lastSection) {
      sectionsCount++;
      lastSection = qSection;
    }

    // Determine question type
    let qType: QuestionType = 'text';
    let choices: ChoiceOption[] | undefined = undefined;

    if (qTypeRaw.includes('number') || qTypeRaw.includes('integer') || qTypeRaw.includes('int') || qTypeRaw.includes('age')) {
      qType = 'integer';
    } else if (qTypeRaw.includes('decimal') || qTypeRaw.includes('currency') || qTypeRaw.includes('amount') || qTypeRaw.includes('cost')) {
      qType = 'decimal';
    } else if (qTypeRaw.includes('yes/no') || qTypeRaw.includes('yesno') || qTypeRaw.includes('boolean')) {
      qType = 'yes_no';
      choices = [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ];
    } else if (qTypeRaw.includes('multiple') || qTypeRaw.includes('checkbox') || qTypeRaw.includes('multi')) {
      qType = 'select_multiple';
    } else if (qTypeRaw.includes('single') || qTypeRaw.includes('radio') || qTypeRaw.includes('choice') || qTypeRaw.includes('select')) {
      qType = 'select_one';
    } else if (qTypeRaw.includes('dropdown')) {
      qType = 'dropdown';
    } else if (qTypeRaw.includes('date') && !qTypeRaw.includes('datetime')) {
      qType = 'date';
    } else if (qTypeRaw.includes('time') && !qTypeRaw.includes('datetime')) {
      qType = 'time';
    } else if (qTypeRaw.includes('gps') || qTypeRaw.includes('location') || qTypeRaw.includes('coordinate')) {
      qType = 'geopoint';
    } else if (qTypeRaw.includes('photo') || qTypeRaw.includes('image') || qTypeRaw.includes('picture')) {
      qType = 'image';
    } else if (qTypeRaw.includes('audio') || qTypeRaw.includes('voice') || qTypeRaw.includes('record')) {
      qType = 'audio';
    } else if (qTypeRaw.includes('signature') || qTypeRaw.includes('sign')) {
      qType = 'signature';
    } else if (qTypeRaw.includes('note') || qTypeRaw.includes('instruction')) {
      qType = 'note';
    } else if (qOptions && qOptions.length > 0) {
      // If options exist but type is unspecified, default to single choice
      qType = 'select_one';
    }

    // Split options if provided
    if (qOptions && qType !== 'yes_no') {
      const delimiters = [';', '\n', '|', ','];
      let chosenDelim = ';';
      for (const d of delimiters) {
        if (qOptions.includes(d)) {
          chosenDelim = d;
          break;
        }
      }
      const rawOptions = qOptions.split(chosenDelim).map(s => s.trim()).filter(Boolean);
      if (rawOptions.length > 0) {
        choiceListsDetected++;
        choices = rawOptions.map((opt, optIdx) => {
          // Check for key=value or 1=Male or A) Male
          const match = opt.match(/^([a-zA-Z0-9_-]+)[=:\-. ]\s*(.*)$/);
          if (match && match[2]) {
            return {
              value: sanitizeVariableName(match[1], 'opt', optIdx + 1),
              label: match[2].trim()
            };
          }
          return {
            value: sanitizeVariableName(opt, 'opt', optIdx + 1),
            label: opt
          };
        });
      }
    }

    const varName = sanitizeVariableName(
      qNum ? `q${qNum}_${qText.slice(0, 15)}` : qText,
      'q',
      order
    );

    const isReq = ['yes', 'true', '1', 'y', 'required'].includes(qRequired);

    let relevantExpr = undefined;
    if (qSkip) {
      skipConditionsCount++;
      // Attempt conversion e.g. "If owns_phone = No" -> "${owns_phone} = 'no'"
      relevantExpr = qSkip;
    }

    questions.push({
      id: `q_${Date.now()}_${i}`,
      name: varName,
      label: qText || `Question ${order}`,
      hint: qHint || undefined,
      type: qType,
      required: isReq,
      choices: choices,
      relevant: relevantExpr,
      order: order++,
      sectionTitle: qSection || undefined
    });
  }

  appendDuplicateWarnings(questions, warnings);

  return {
    fileName,
    fileType: 'Excel Questionnaire',
    detectedFormTitle: firstSheetName && firstSheetName !== 'Sheet1' ? firstSheetName : 'Imported Excel Questionnaire',
    questionsCount: questions.length,
    sectionsCount: sectionsCount || 1,
    choiceListsCount: choiceListsDetected,
    skipConditionsCount,
    calculationsCount,
    questions,
    warnings
  };
}

/**
 * Parses simple XML questionnaire definitions into CMRG questions
 */
export function parseXmlQuestionnaire(xmlText: string, fileName: string): FormImportResult {
  const warnings: ImportWarning[] = [];
  const questions: Question[] = [];
  const questionBlocks = [...xmlText.matchAll(/<(?:question|item|field)\b[^>]*>([\s\S]*?)<\/(?:question|item|field)>/gi)];

  if (questionBlocks.length === 0) {
    return parseTextQuestionnaire(xmlText, fileName, 'XML');
  }

  for (let index = 0; index < questionBlocks.length; index++) {
    const block = questionBlocks[index][1];
    const name = (block.match(/<name>([\s\S]*?)<\/name>/i) || [])[1]?.replace(/<[^>]+>/g, '').trim() || sanitizeVariableName(`question_${index + 1}`, 'q', index + 1);
    const label = (block.match(/<label>([\s\S]*?)<\/label>/i) || [])[1]?.replace(/<[^>]+>/g, '').trim() || name;
    const type = (block.match(/<type>([\s\S]*?)<\/type>/i) || [])[1]?.trim().toLowerCase() || 'text';
    const required = /<required>\s*(true|yes|1)\s*<\/required>/i.test(block);
    const relevant = (block.match(/<relevant>([\s\S]*?)<\/relevant>/i) || [])[1]?.trim();

    const normalizedType = type.includes('select_one') ? 'select_one' : type.includes('select_multiple') ? 'select_multiple' : type.includes('integer') ? 'integer' : type.includes('decimal') ? 'decimal' : type.includes('date') ? 'date' : type.includes('geopoint') ? 'geopoint' : type.includes('image') ? 'image' : type.includes('audio') ? 'audio' : type.includes('note') ? 'note' : 'text';

    questions.push({
      id: `q_${Date.now()}_${index}`,
      name,
      label,
      type: normalizedType,
      required,
      relevant: relevant || undefined,
      order: index + 1
    });
  }

  appendDuplicateWarnings(questions, warnings);

  return {
    fileName,
    fileType: 'XML',
    detectedFormTitle: fileName.replace(/\.[^/.]+$/, '') || 'Imported XML Questionnaire',
    questionsCount: questions.length,
    sectionsCount: 1,
    choiceListsCount: 0,
    skipConditionsCount: questions.filter(q => q.relevant).length,
    calculationsCount: 0,
    questions,
    warnings
  };
}

/**
 * Parses a plain text / Word / PDF extracted document content into questions
 */
export function parseTextQuestionnaire(text: string, fileName: string, fileType: 'Word' | 'PDF' | 'CSV' | 'TSV' | 'JSON' | 'XML' | 'Text'): FormImportResult {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions: Question[] = [];
  const warnings: ImportWarning[] = [];
  let sectionsCount = 0;
  let skipConditionsCount = 0;
  let choiceListsCount = 0;

  let currentQuestion: Partial<Question> | null = null;
  let currentChoices: ChoiceOption[] = [];
  let order = 1;

  const finalizeCurrent = () => {
    if (currentQuestion && currentQuestion.label) {
      if (currentChoices.length > 0 && (!currentQuestion.choices || currentQuestion.choices.length === 0)) {
        currentQuestion.choices = [...currentChoices];
        if (currentQuestion.type === 'text') {
          currentQuestion.type = 'select_one';
        }
        choiceListsCount++;
      }
      questions.push({
        id: `q_${Date.now()}_${questions.length}`,
        name: currentQuestion.name || sanitizeVariableName(currentQuestion.label, 'q', order),
        label: currentQuestion.label,
        hint: currentQuestion.hint,
        type: currentQuestion.type || 'text',
        required: Boolean(currentQuestion.required),
        choices: currentQuestion.choices,
        relevant: currentQuestion.relevant,
        order: order++,
        sectionTitle: currentQuestion.sectionTitle
      });
      currentQuestion = null;
      currentChoices = [];
    }
  };

  let activeSection = '';

  for (const line of lines) {
    // Check section header e.g. "SECTION A: DEMOGRAPHICS" or "Module 1:"
    if (/^(SECTION|MODULE|PART)\s+[A-Z0-9]+[:\s]/i.test(line)) {
      finalizeCurrent();
      activeSection = line;
      sectionsCount++;
      continue;
    }

    // Check Question header e.g. "1. What is your age?", "Q2: Gender", "3) Own a phone?"
    const qMatch = line.match(/^(\d+|Q\d+|[A-Z]\d+)[.):\-]\s*(.*)$/i);
    if (qMatch) {
      finalizeCurrent();
      const qNum = qMatch[1];
      const qText = qMatch[2];
      const isReq = qText.includes('*') || /\[required\]/i.test(qText);
      const cleanText = qText.replace('*', '').replace(/\[required\]/i, '').trim();

      // Check skip in brackets e.g. [If NO, skip to Q5]
      let skipExpr: string | undefined = undefined;
      const skipMatch = cleanText.match(/\[(If\s+[^\]]+)\]/i);
      if (skipMatch) {
        skipConditionsCount++;
        skipExpr = skipMatch[1];
      }

      currentQuestion = {
        name: sanitizeVariableName(`q${qNum}_${cleanText.slice(0, 15)}`, 'q', order),
        label: cleanText,
        type: /age|number|amount|cost|spend|income/i.test(cleanText) ? 'integer' : 'text',
        required: isReq,
        relevant: skipExpr,
        sectionTitle: activeSection || undefined
      };
      continue;
    }

    // Check Options line e.g. "a) Male  b) Female" or "[ ] Yes  [ ] No" or "1. Single"
    if (currentQuestion) {
      // Check multi-choice bracket tokens e.g. "[ ] Yes" or "( ) Yes" or "A) Yes"
      if (/^(\[[\s_xX]?\]|\([\s_xX]?\)|\b[a-zA-Z\d][).])\s+/i.test(line)) {
        const optClean = line.replace(/^(\[[\s_xX]?\]|\([\s_xX]?\)|\b[a-zA-Z\d][).])\s*/i, '').trim();
        if (optClean) {
          currentChoices.push({
            value: sanitizeVariableName(optClean, 'opt', currentChoices.length + 1),
            label: optClean
          });
        }
        continue;
      }
      // Check if line is a hint/instruction
      if (/^(Note|Instruction|Hint):/i.test(line)) {
        currentQuestion.hint = line.replace(/^(Note|Instruction|Hint):\s*/i, '');
        continue;
      }
    }
  }
  finalizeCurrent();

  // If no questions found via numbering, fallback to splitting lines
  if (questions.length === 0) {
    lines.forEach((l, idx) => {
      questions.push({
        id: `q_${Date.now()}_${idx}`,
        name: sanitizeVariableName(l, 'q', idx + 1),
        label: l,
        type: 'text',
        required: false,
        order: idx + 1
      });
    });
  }

  appendDuplicateWarnings(questions, warnings);

  return {
    fileName,
    fileType,
    detectedFormTitle: activeSection || fileName.replace(/\.[^/.]+$/, '') || 'Imported Questionnaire',
    questionsCount: questions.length,
    sectionsCount: sectionsCount || 1,
    choiceListsCount,
    skipConditionsCount,
    calculationsCount: 0,
    questions,
    warnings
  };
}

/**
 * Universal Importer dispatcher
 */
export function processUploadedQuestionnaire(
  fileBuffer: Buffer,
  fileName: string,
  mimetype?: string
): FormImportResult {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  const rawText = fileBuffer.toString('utf-8');
  const finalize = (result: FormImportResult) => validateImportedResult(result);

  // XLSForm / Excel workbook formats
  if (['.xlsx', '.xls', '.xlsform'].includes(ext)) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames.map(s => s.trim().toLowerCase());
    if (sheetNames.includes('survey')) {
      return finalize(parseXLSForm(workbook, fileName));
    }
    return finalize(parseOrdinaryExcelQuestionnaire(workbook, fileName));
  }

  // Delimited tabular formats
  if (['.csv', '.tsv'].includes(ext)) {
    const workbook = XLSX.read(rawText, {
      type: 'string',
      FS: ext === '.tsv' ? '\t' : ','
    });
    const sheetNames = workbook.SheetNames.map(s => s.trim().toLowerCase());
    if (sheetNames.includes('survey')) {
      return finalize(parseXLSForm(workbook, fileName));
    }
    return finalize(parseOrdinaryExcelQuestionnaire(workbook, fileName));
  }

  // JSON
  if (ext === '.json') {
    const jsonStr = rawText;
    const parsed = JSON.parse(jsonStr);
    if (parsed.questions && Array.isArray(parsed.questions)) {
      const questions = parsed.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q_${Date.now()}_${index}`,
        name: q.name || sanitizeVariableName(q.label || `question_${index + 1}`, 'q', index + 1),
        order: q.order ?? index + 1
      }));
      const warnings: ImportWarning[] = [];
      appendDuplicateWarnings(questions, warnings);
      return finalize({
        fileName,
        fileType: 'JSON',
        detectedFormTitle: parsed.title || parsed.formTitle || 'Imported CMRG Form',
        questionsCount: questions.length,
        sectionsCount: parsed.sectionsCount || 1,
        choiceListsCount: questions.filter((q: any) => q.choices && q.choices.length > 0).length,
        skipConditionsCount: questions.filter((q: any) => q.relevant).length,
        calculationsCount: questions.filter((q: any) => q.calculation).length,
        questions,
        warnings
      });
    }
  }

  // XML questionnaire definitions
  if (ext === '.xml' || /<(?:survey|question|item|field|choices)[\s>]/i.test(rawText)) {
    return finalize(parseXmlQuestionnaire(rawText, fileName));
  }

  // Plain text, Word, PDF, or other text-based questionnaires
  if (ext === '.txt' || ext === '.docx' || ext === '.pdf' || !ext || ext === '.rtf') {
    return finalize(parseTextQuestionnaire(
      rawText,
      fileName,
      ext === '.docx' ? 'Word' : ext === '.pdf' ? 'PDF' : ext === '.txt' ? 'Text' : 'Text'
    ));
  }

  return finalize(parseTextQuestionnaire(
    rawText,
    fileName,
    ext === '.docx' ? 'Word' : ext === '.pdf' ? 'PDF' : 'CSV'
  ));
}
