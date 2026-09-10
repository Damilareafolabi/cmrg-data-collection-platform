# CMRG Survey — Comprehensive Quality Assurance & Test Plan

This document defines the formal test procedures, acceptance criteria, and execution instructions for validating all functional subsystems of the **CMRG Survey Platform** and **CMRG Collect** Android application.

---

## 1. Automated Test Execution

Run the built-in automated test suite:
```bash
npm test
```
*Expected Result: All 13 core tests pass green, covering skip logic evaluation, compound boolean operators, boundary constraints, calculated formulas, and idempotent sync deduplication.*

---

## 2. Test Procedures by Subsystem

### Test Procedure 1: Questionnaire Builder & Preview
- **Objective:** Verify interactive authoring of questionnaires across multiple data types.
- **Steps:**
  1. Open CMRG Central Console (`/forms`).
  2. Click **"New Questionnaire"**.
  3. Add the following questions:
     - `full_name` (Type: Text, Required: Yes)
     - `respondent_age` (Type: Integer, Constraint: `. >= 18 and . <= 99`)
     - `has_bank_account` (Type: Select One, Choices: `yes`, `no`)
     - `bank_name` (Type: Text, Relevant: `${has_bank_account} = 'yes'`)
     - `household_location` (Type: Geopoint, Required: No)
  4. Click **"Preview / Test Runner"** to launch interactive simulation.
- **Pass Criteria:**
  - `bank_name` question appears *only* when `has_bank_account` is answered `'yes'`.
  - Age less than 18 or greater than 99 triggers constraint violation error.
  - Form saves and increments version tag upon publish.

---

### Test Procedure 2: XLSForm & Excel Import
- **Objective:** Verify zero-effort migration of existing field research questionnaires without manual rebuilds.
- **Steps:**
  1. Click **"Import Form"** in the top navigation or drag-and-drop modal.
  2. Upload an XLSForm (`.xlsx`) containing `survey` and `choices` sheets.
  3. Inspect the parsed schema review modal showing question counts and detected logic.
  4. Choose **"Publish Directly"** or **"Open in Builder"**.
- **Pass Criteria:**
  - All questions, types, choice lists, and relevance strings are mapped into CMRG schema without data loss.

---

### Test Procedure 3: Skip Logic & Calculation Engine
- **Objective:** Test ODK-compatible expressions under complex conditions.
- **Test Matrix:**
  | Expression | Input Data | Expected Result |
  | :--- | :--- | :--- |
  | `${owns_car} = 'yes'` | `{ owns_car: 'yes' }` | Visible (`true`) |
  | `${owns_car} = 'yes'` | `{ owns_car: 'no' }` | Hidden (`false`) |
  | `${age} >= 18 and ${status} = 'employed'` | `{ age: 24, status: 'employed' }` | Visible (`true`) |
  | `${age} >= 18 and ${status} = 'employed'` | `{ age: 16, status: 'employed' }` | Hidden (`false`) |
  | Calculation: `${qty} * ${unit_price}` | `{ qty: 10, unit_price: 250 }` | Value: `2500` |
- **Pass Criteria:** Expressions evaluate instantaneously without exceptions.

---

### Test Procedure 4: Offline Field Storage & Recovery
- **Objective:** Verify data retention during network interruptions.
- **Steps:**
  1. In the top navigation bar, click the **ONLINE / OFFLINE** simulator button to simulate field conditions.
  2. Complete an interview in CMRG Collect or the field emulator.
  3. Refresh the browser tab or close and re-open the screen.
  4. Inspect the Drafts / Pending Sync Queue.
- **Pass Criteria:**
  - Answers remain cached in client storage (`IndexedDB` / mobile `SQLite`).
  - Pending sync badge displays accurate unsynced record count.

---

### Test Procedure 5: Synchronization & Deduplication
- **Objective:** Verify idempotent ingestion guarantees zero duplicates on poor connections.
- **Steps:**
  1. Run the automated concurrency stress script:
     ```bash
     npx tsx scripts/simulate-field-sync.ts
     ```
  2. Observe network responses for 100 submissions sent with deliberate duplicate UUID retries.
- **Pass Criteria:**
  - Only unique `clientSubmissionId` values are accepted into the database.
  - Server returns `duplicatesDetected: >0` without throwing 500 errors.

---

### Test Procedure 6: GPS Geopoint & Media Handling
- **Objective:** Verify spatial and multimedia collection.
- **Steps:**
  1. Trigger GPS capture in CMRG Collect.
  2. Verify coordinates: latitude, longitude, and accuracy radius (±m).
  3. Attach a test photo and voice note.
  4. Submit record and inspect Submissions Explorer.
- **Pass Criteria:**
  - Coordinates render accurately on review screens.
  - Attachments are retrievable via secure media endpoints.

---

### Test Procedure 7: Export Generation
- **Objective:** Verify export fidelity for statistical packages.
- **Steps:**
  1. Navigate to **Submissions & QA** (`/submissions`).
  2. Export data in all three formats:
     - **Excel (.xlsx)**
     - **CSV (.csv)**
     - **JSON (.json)**
  3. Open the `.xlsx` file in Excel or LibreOffice.
- **Pass Criteria:**
  - Workbook contains both `Submissions` and `Codebook` sheets.
  - All answered variable columns match the form question names.
  - Timestamps, enumerator IDs, review statuses, and GPS coordinates are cleanly formatted.

---

### Test Procedure 8: Mobile Android Field Workflow (`CMRG Collect`)
- **Objective:** End-to-end field enumeration cycle on Android hardware.
- **Steps:**
  1. Build and install the APK (`flutter build apk --debug`).
  2. Log in as an Enumerator (`tunde.adebayo@cmrg.org`).
  3. Fetch latest published forms from central server.
  4. Put device in Airplane Mode.
  5. Complete 3 separate household interviews.
  6. Disable Airplane Mode.
  7. Tap **"Sync All Records"**.
- **Pass Criteria:**
  - Forms are downloaded successfully.
  - Interviews complete smoothly without connectivity.
  - All 3 records synchronize to central server upon reconnecting.
