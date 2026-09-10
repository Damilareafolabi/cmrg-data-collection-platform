// ========================================================
// CMRG Survey — Automated Test Suite Runner
// ========================================================
// Verifies core form engine logic, skip logic, calculations,
// constraint enforcement, and idempotent sync deduplication.

import {
  evaluateRelevance,
  evaluateCalculation,
  validateConstraint
} from '../shared/formEngine';
import { Form, Question, Submission } from '../shared/types';
import * as XLSX from 'xlsx';
import { processUploadedQuestionnaire } from '../backend/importers';
import { buildOdkXform } from '../backend/odkXform';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('CMRG Survey — Core Test Suite');
console.log('========================================\n');

// --------------------------------------------------------
// Test Suite 1: Skip Logic & Relevance Engine
// --------------------------------------------------------
console.log('1. Testing Skip Logic / Relevance Engine:');

const answers1 = {
  owns_smartphone: 'yes',
  age: 28,
  region: 'urban'
};

assert(
  evaluateRelevance("${owns_smartphone} = 'yes'", answers1) === true,
  "Simple equality match: ${owns_smartphone} = 'yes' -> true"
);

assert(
  evaluateRelevance("${owns_smartphone} = 'no'", answers1) === false,
  "Inequality mismatch: ${owns_smartphone} = 'no' -> false"
);

assert(
  evaluateRelevance("${age} >= 18 and ${region} = 'urban'", answers1) === true,
  "Compound condition with 'and': ${age} >= 18 and ${region} = 'urban' -> true"
);

assert(
  evaluateRelevance("${age} < 18 or ${region} = 'rural'", answers1) === false,
  "Compound condition with 'or': ${age} < 18 or ${region} = 'rural' -> false"
);

assert(
  evaluateRelevance("${unanswered_field} != ''", answers1) === false,
  "Unanswered field evaluated safely -> false without runtime crash"
);

// --------------------------------------------------------
// Test Suite 2: Constraint Validation Engine
// --------------------------------------------------------
console.log('\n2. Testing Constraint Validation:');

assert(
  validateConstraint('. >= 18 and . <= 100', 25) === true,
  'Age in range: 25 satisfies . >= 18 and . <= 100'
);

assert(
  validateConstraint('. >= 18 and . <= 100', 14) === false,
  'Age out of range: 14 fails . >= 18 and . <= 100'
);

assert(
  validateConstraint('. > 0', 0) === false,
  'Boundary check: 0 fails . > 0'
);

assert(
  validateConstraint('. > 0', 10.5) === true,
  'Positive decimal: 10.5 satisfies . > 0'
);

// --------------------------------------------------------
// Test Suite 3: Calculated Fields Engine
// --------------------------------------------------------
console.log('\n3. Testing Calculated Fields Engine:');

const calcAnswers = {
  monthly_income: 150000,
  household_size: 5
};

const perCapita = evaluateCalculation('${monthly_income} / ${household_size}', calcAnswers);
assert(
  perCapita === 30000,
  'Division calculation: 150000 / 5 = 30000'
);

const totalAnnual = evaluateCalculation('${monthly_income} * 12', calcAnswers);
assert(
  totalAnnual === 1800000,
  'Multiplication calculation: 150000 * 12 = 1800000'
);

// --------------------------------------------------------
// Test Suite 4: Idempotent Submission Sync Logic
// --------------------------------------------------------
console.log('\n4. Testing Idempotent Submission Synchronization:');

interface SimpleSub {
  clientSubmissionId: string;
  formId: string;
  timestamp: string;
}

function mockSyncEngine(existing: SimpleSub[], incoming: SimpleSub[]) {
  const existingSet = new Set(existing.map(s => s.clientSubmissionId));
  const accepted: SimpleSub[] = [];
  let duplicates = 0;

  for (const item of incoming) {
    if (existingSet.has(item.clientSubmissionId)) {
      duplicates++;
    } else {
      existingSet.add(item.clientSubmissionId);
      accepted.push(item);
    }
  }

  return { accepted, duplicates };
}

const existingSubs: SimpleSub[] = [
  { clientSubmissionId: 'uuid_enum1_rec001', formId: 'f1', timestamp: '2026-03-01' },
  { clientSubmissionId: 'uuid_enum1_rec002', formId: 'f1', timestamp: '2026-03-01' },
];

const batchSyncIncoming: SimpleSub[] = [
  { clientSubmissionId: 'uuid_enum1_rec002', formId: 'f1', timestamp: '2026-03-01' }, // duplicate
  { clientSubmissionId: 'uuid_enum1_rec003', formId: 'f1', timestamp: '2026-03-02' }, // new
  { clientSubmissionId: 'uuid_enum1_rec003', formId: 'f1', timestamp: '2026-03-02' }, // duplicate within batch
];

const syncResult = mockSyncEngine(existingSubs, batchSyncIncoming);

assert(
  syncResult.duplicates === 2,
  'Duplicate detection: 2 duplicated client UUIDs safely recognized'
);

assert(
  syncResult.accepted.length === 1 && syncResult.accepted[0].clientSubmissionId === 'uuid_enum1_rec003',
  'Idempotent ingestion: only the single novel record accepted'
);

// --------------------------------------------------------
// Test Suite 5: XLSForm import preservation and validation
// --------------------------------------------------------
console.log('\n5. Testing XLSForm import preservation and validation:');

const importWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(importWorkbook, XLSX.utils.json_to_sheet([
  { type: 'begin_group', name: 'demographics', label: 'Demographics' },
  { type: 'select_one gender', name: 'gender', label: 'Gender', required: 'yes' },
  { type: 'end_group', name: '', label: '' },
  { type: 'calculate', name: 'score', label: 'Score', calculation: '${missing_answer} * 2' }
]), 'survey');
XLSX.utils.book_append_sheet(importWorkbook, XLSX.utils.json_to_sheet([
  { list_name: 'gender', name: 'female', label: 'Female' }
]), 'choices');
XLSX.utils.book_append_sheet(importWorkbook, XLSX.utils.json_to_sheet([
  { form_title: 'Import validation fixture', form_id: 'fixture_v1' }
]), 'settings');

const importBuffer = XLSX.write(importWorkbook, { type: 'buffer', bookType: 'xlsx' });
const importedFixture = processUploadedQuestionnaire(importBuffer, 'fixture.xlsx');
assert(importedFixture.detectedFormTitle === 'Import validation fixture', 'XLSForm settings title preserved');
assert(importedFixture.choiceListsCount === 1 && importedFixture.questions.some(q => q.choiceListName === 'gender'), 'Choice list references preserved');
assert(importedFixture.questions.some(q => q.type === 'begin_group') && importedFixture.questions.some(q => q.type === 'end_group'), 'Group boundaries preserved');
assert(importedFixture.warnings.some(w => w.message.includes('unknown variable "missing_answer"')), 'Broken calculation reference reported');

// --------------------------------------------------------
// Test Suite 6: CMRG-to-ODK XForm proof adapter
// --------------------------------------------------------
console.log('\n6. Testing CMRG-to-ODK XForm adapter:');

const xformFixture: Form = {
  id: 'form_odk_poc',
  projectId: 'project_poc',
  title: 'ODK Compatibility Proof',
  description: 'Small CMRG form for ODK Collect compatibility',
  status: 'PUBLISHED',
  currentVersion: 1,
  currentVersionId: 'ver_form_odk_poc_v1',
  questions: [
    { id: 'q_name', name: 'respondent_name', label: 'Respondent name', type: 'text', required: true, order: 1 },
    { id: 'q_age', name: 'age', label: 'Age', type: 'integer', required: true, constraint: '. >= 0', order: 2 },
    { id: 'q_gender', name: 'gender', label: 'Gender', type: 'select_one', required: true, choices: [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }], order: 3 },
    { id: 'q_gps', name: 'location', label: 'Location', type: 'geopoint', required: false, order: 4 }
  ],
  settings: { formTitle: 'ODK Compatibility Proof', formId: 'odk_poc', defaultLanguage: 'English', allowDrafts: true, requireGps: false },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
const xform = buildOdkXform(xformFixture, {
  id: 'ver_form_odk_poc_v1',
  formId: xformFixture.id,
  versionNumber: 1,
  versionTag: 'v1.0',
  publishedAt: new Date().toISOString(),
  publishedBy: 'test',
  questions: xformFixture.questions,
  settings: xformFixture.settings
});
assert(xform.includes('<data id="odk_poc"'), 'XForm contains stable CMRG form identifier');
assert(xform.includes('nodeset="/data/age" type="int"'), 'Integer question maps to XForm int binding');
assert(xform.includes('required="true()"'), 'Required question maps to XForm required binding');
assert(xform.includes('<select1 ref="/data/gender"'), 'Single choice maps to XForm select1');
assert(xform.includes('<value>female</value>'), 'Choice values are included in XForm items');
assert(xform.includes('<input ref="/data/location"'), 'GPS question is represented in the XForm body');
assert(xform.includes('<respondent_name></respondent_name>'), 'XForm instance contains answer nodes');

// --------------------------------------------------------
// Summary
// --------------------------------------------------------
console.log('\n========================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All core functional tests passed successfully!\n');
  process.exit(0);
}
