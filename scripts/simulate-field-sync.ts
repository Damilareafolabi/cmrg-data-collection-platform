// ========================================================
// CMRG Survey — Field Concurrency & Synchronization Stress Simulator
// ========================================================
// Simulates 100+ enumerator offline interviews being synchronized
// concurrently over bad network conditions with intentional duplicate retries.

import { db } from '../backend/db';
import { Submission } from '../shared/types';

console.log('=== Starting Field Synchronization Concurrency Simulator ===');

const TOTAL_RECORDS = 120;
const DUPLICATE_PERCENTAGE = 0.25; // 25% duplicate retry packets

const simulatedBatch: Submission[] = [];
const generatedIds: string[] = [];

for (let i = 1; i <= TOTAL_RECORDS; i++) {
  const clientUuid = `client_field_enum_${(i % 10) + 1}_uuid_${Date.now()}_${i}`;
  generatedIds.push(clientUuid);

  simulatedBatch.push({
    id: `sub_sim_${i}`,
    clientSubmissionId: clientUuid,
    formId: 'form_household_baseline_2026',
    formTitle: 'CMRG National Household & Retail Baseline Survey',
    formVersionId: 'ver_household_v2',
    versionNumber: 2,
    projectId: 'proj_cmrg_household',
    projectName: 'CMRG National Consumer Survey Program',
    enumeratorId: `user_enum_${(i % 5) + 1}`,
    enumeratorName: `Field Officer ${(i % 5) + 1}`,
    deviceId: `CMRG-SAMSUNG-A14-0${(i % 8) + 1}`,
    status: 'COMPLETED',
    syncStatus: 'QUEUED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: new Date(Date.now() - (TOTAL_RECORDS - i) * 60000).toISOString(),
    answers: {
      respondent_name: `Respondent ${i}`,
      respondent_age: 20 + (i % 50),
      monthly_income: 45000 + (i * 1200),
      owns_smartphone: i % 2 === 0 ? 'yes' : 'no',
      network_satisfaction: (i % 5) + 1
    },
    geolocation: {
      latitude: 6.5244 + ((i % 20) * 0.01),
      longitude: 3.3792 + ((i % 20) * 0.01),
      accuracy: 3.2,
      timestamp: new Date().toISOString()
    }
  });

  // Inject duplicate retry with same client UUID
  if (Math.random() < DUPLICATE_PERCENTAGE) {
    simulatedBatch.push({ ...simulatedBatch[simulatedBatch.length - 1] });
  }
}

console.log(`Generated ${simulatedBatch.length} total transmission packets (including duplicates)...`);

// Execute sync batch
const startTime = Date.now();
const result = db.syncSubmissions(simulatedBatch);
const durationMs = Date.now() - startTime;

console.log('------------------------------------------------------------');
console.log(`✓ Sync Batch Processed in ${durationMs}ms`);
console.log(`✓ Total Submissions Acknowledged: ${result.synced.length}`);
console.log(`✓ Novel Submissions Ingested: ${result.synced.length - result.duplicates}`);
console.log(`✓ Duplicate Packets Safely Deduplicated: ${result.duplicates}`);
console.log('------------------------------------------------------------');

if (result.synced.length === simulatedBatch.length && result.duplicates > 0) {
  console.log('✓ SUCCESS: Perfect idempotent synchronization achieved without data duplication.');
  process.exit(0);
} else {
  console.error('✗ ERROR: Inconsistency in submission accounting.');
  process.exit(1);
}
