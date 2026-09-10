# CMRG Survey — Production Readiness Checklist

This checklist tracks all tasks required to transition the CMRG Survey platform from pre-production engineering to live commercial fieldwork operations.

---

## 1. Database & Infrastructure Readiness

- [ ] **PostgreSQL Database Provisioning**
  - [ ] Dedicated PostgreSQL 15+ instance created (AWS RDS / GCP Cloud SQL / Neon).
  - [ ] SSL connection enforced (`sslmode=require`).
  - [ ] Connection pool sizing configured (min: 5, max: 50 connections).
- [ ] **Schema Migration Applied**
  - [ ] Executed `database/schema.sql` on the live database.
  - [ ] Verified initial seed data (roles, default projects, users).
  - [ ] Verified unique index on `submissions(client_submission_id)` for idempotent deduplication.
- [ ] **Automated Disaster Recovery**
  - [ ] Automated daily database dumps configured (`pg_dump` via cron).
  - [ ] Backup encryption enabled (GPG / AWS KMS).
  - [ ] Tested restoring a backup on a staging database.

---

## 2. Backend Security & Hardening

- [ ] **Environment Configuration**
  - [ ] Copied `.env.example` to production `.env`.
  - [ ] Strong `AUTH_SECRET` generated (64-byte random hex).
  - [ ] API URLs (`API_URL`, `ANDROID_API_URL`) pointed to production domain.
- [ ] **Network & Transport Security**
  - [ ] HTTPS enforced across all endpoints via reverse proxy / Cloudflare SSL.
  - [ ] CORS headers restricted to authorized CMRG domains and mobile User-Agent.
  - [ ] Rate limiting enabled on `/api/submissions/sync` and `/api/auth`.
- [ ] **File Storage Hardening**
  - [ ] Cloud bucket (S3/GCS) configured with private access for photo/audio uploads.
  - [ ] Max upload size capped at 50MB per media request.

---

## 3. Questionnaire & Logic Engine Verification

- [ ] **Form Import Capabilities**
  - [ ] Tested uploading real XLSForm (.xlsx) files with 50+ questions.
  - [ ] Verified conversion of single select (`select_one`), multiple select (`select_multiple`), rating, and geopoint.
  - [ ] Verified that question labels, hints, and constraint messages are preserved.
- [ ] **Logic & Expression Validation**
  - [ ] Skip logic conditions tested (e.g. `${age} >= 18 and ${owns_phone} = 'yes'`).
  - [ ] Range constraints tested (`. >= 0 and . <= 120`).
  - [ ] Dynamic calculation fields verified (e.g. income per capita calculation).
  - [ ] Unit tests passing: `npm test` (13/13 tests green).

---

## 4. Mobile Android (`CMRG Collect`) Readiness

- [ ] **Build & Compilation**
  - [ ] Flutter dependencies verified: `flutter pub get`.
  - [ ] Debug APK compiled: `flutter build apk --debug`.
  - [ ] Release signing keystore generated (`cmrg-release.jks`).
  - [ ] Production APK generated: `flutter build apk --release`.
- [ ] **Offline Field Testing**
  - [ ] Installed APK on real Android device (API 21 - API 34).
  - [ ] Downloaded blank questionnaires over Wi-Fi.
  - [ ] Toggled airplane mode and filled out complete interview with GPS geopoint and photo.
  - [ ] Re-enabled network and triggered background synchronization.
  - [ ] Verified that client UUID prevents duplicate entries upon retries.

---

## 5. Field Synchronization & Concurrency Stress Test

- [ ] **Concurrency Benchmark**
  - [ ] Simulated 100+ concurrent offline submissions using `scripts/simulate-field-sync.ts`.
  - [ ] Verified that 0 duplicate records were created.
  - [ ] Average sync request latency under 500ms.
- [ ] **Audit Trail & Attribution**
  - [ ] Verified `deviceId`, `enumeratorId`, and timestamp logged on every record.
  - [ ] Verified device activity update in `/api/devices`.

---

## 6. Review Workflow & Export Verification

- [ ] **Quality Assurance Module**
  - [ ] Supervisor able to review submissions and mark status (`APPROVED`, `FLAGGED`, `REJECTED`).
  - [ ] Review notes and reviewer name recorded.
- [ ] **Data Export Verification**
  - [ ] Verified Excel export (`/api/export/xlsx`):
    - [ ] `Submissions` sheet with all flattened variable columns.
    - [ ] `Codebook` sheet with variable dictionary, labels, types, and choices.
  - [ ] Verified CSV export (`/api/export/csv`).
  - [ ] Verified JSON export (`/api/export/json`).
  - [ ] Tested importing exported files into SPSS / Stata / R without column formatting issues.

---

## 7. Monitoring & Operational Sign-off

- [ ] **Server Telemetry**
  - [ ] Application health check verified at `/api/health`.
  - [ ] Server log aggregation configured (Datadog, CloudWatch, or Google Cloud Logging).
- [ ] **Product Team Sign-off**
  - [ ] Lead Developer: Afolabi Oluwadamilare Simeon
  - [ ] Brand & Strategy: Samuel Korede
  - [ ] Product & Operations: CMRG Internal Research Directorate
