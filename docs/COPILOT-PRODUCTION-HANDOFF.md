# CMRG Survey — GitHub Copilot & VS Code Production Handoff Specification

## 1. Project Summary & Purpose

**Product Name:** CMRG Survey  
**Android Field Client:** CMRG Collect  
**Owner / Organization:** Consumer & Market Research Group Ltd. (CMRG Ltd. RC378525)  
**Lead Developers & Architects:**  
- **Afolabi Oluwadamilare Simeon** — Full Stack App Developer  
- **Samuel Korede** — Full Stack App Developer & Brand Strategist  
- *with the wider product, engineering, and creative team.*

CMRG Survey is an enterprise-grade, sovereign survey research and fieldwork data collection platform designed to replace external dependencies (such as SurveyCTO, ODK Aggregate, KoboToolbox). It allows CMRG to control the entire lifecycle of field research:
```
CREATE / IMPORT → TEST → PUBLISH → ASSIGN → COLLECT OFFLINE → SYNCHRONIZE → MONITOR → REVIEW → EXPORT
```

This repository contains the complete full-stack implementation, including the central web platform, backend services, database schema migrations, and native Flutter/Android client (`/mobile`). This document guides the production engineering team using **VS Code + GitHub Copilot Agent** to finalize production deployment, database provisioning, and release builds.

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CMRG SURVEY MONOREPO                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                               │
      ┌────────────────────────────────────────┼────────────────────────────────────────┐
      ▼                                        ▼                                        ▼
┌──────────────┐                       ┌──────────────┐                        ┌─────────────────┐
│ /src (Web)   │                       │ /server.ts   │                        │ /mobile (Dart)  │
│ React 19     │◄── HTTP REST / JSON ──┤ /backend     │◄── HTTP REST / Sync ───┤ Flutter Engine  │
│ Tailwind CSS │                       │ Express + TS │                        │ SQLite Local DB │
│ Vite Bundler │                       │ Multer/XLSX  │                        │ Android SDK 34  │
└──────────────┘                       └───────┬──────┘                        └─────────────────┘
                                               │
                                 ┌─────────────┴─────────────┐
                                 ▼                           ▼
                        ┌─────────────────┐         ┌─────────────────┐
                        │ /database       │         │ /shared         │
                        │ PostgreSQL DDL  │         │ Types & Engine  │
                        │ Migrations & pg │         │ Skip & Math     │
                        └─────────────────┘         └─────────────────┘
```

---

## 3. Current State of Each Subsystem

| Subsystem | Location | Technologies | Current Working State |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | `/src` | React 19.3.0, Tailwind CSS v4, Lucide | **100% Operational.** Central Dashboard, Projects, Questionnaire Builder, Drag & Drop XLSForm Import, Deployments, Submissions QA Explorer, Marketing Landing, Role Switcher. |
| **Backend API** | `/server.ts`, `/backend` | Node.js (v22), Express, Multer, XLSX | **100% Operational.** REST API endpoints for forms, projects, idempotent sync, file/media upload, Excel/CSV export with codebook generator, and DB backup. |
| **Database** | `/database`, `/backend/db.ts` | PostgreSQL DDL (`schema.sql`), JSON fallback | **Dual Mode Ready.** Uses JSON storage (`cmrg_database.json`) for zero-dependency instant development; production DDL schema and connection abstractions are ready for PostgreSQL. |
| **Shared Logic** | `/shared` | TypeScript (Universal) | **100% Operational.** Shared types, ODK expression parser (`evaluateRelevance`), constraints (`validateConstraint`), calculations (`evaluateCalculation`), and recalculation engine. |
| **Mobile Android** | `/mobile` | Flutter 3.19+, Dart, SQLite (`sqflite`) | **Source Complete.** Clean Flutter project with AndroidManifest, Gradle 8+, screens (login, home, forms, interview stepper, drafts, sync), offline db service, and logic engine. |

---

## 4. What Is Working Right Now

1. **Questionnaire Design & Import:**
   - Visual questionnaire builder supporting text, integers, decimals, select_one, select_multiple, dates, geopoint, audio, photos, rating, ranking, and calculations.
   - Drag & drop XLSForm/Excel parser converting uploaded `.xlsx` files into validated survey structures without recreating them manually.
   - Real-time in-app interactive questionnaire test runner.
2. **Field Sync & Idempotency:**
   - Offline form storage in browser `IndexedDB` (`src/lib/offlineStorage.ts`) and mobile SQLite.
   - Batch sync endpoint (`POST /api/submissions/sync`) that checks client-side UUIDs and guarantees zero duplicate submissions.
3. **Supervisor Review & Quality Control:**
   - Status transitions (`PENDING`, `APPROVED`, `FLAGGED`, `REJECTED`) with reviewer attribution and audit notes.
4. **Data Exports:**
   - Real Excel (`.xlsx`) generation with two sheets: `Submissions` (all flattened columns) and `Codebook` (variable metadata).
   - Standard CSV and raw JSON exports.
5. **Role-Based Access:**
   - Profiles for Admin, Project Manager, Supervisor, Enumerator, and Data Analyst.
6. **Automated Testing:**
   - Test suite (`npm test`) executing in CI/CD verifying skip logic, calculations, constraints, and idempotent sync.

---

## 5. What VS Code GitHub Copilot Needs to Do (Production Secrets & Keys Injection)

> ⚡ **DIRECTIVE FOR VS CODE GITHUB COPILOT:**  
> All cryptographic keys, database passwords, and API secrets were **intentionally skipped / left blank** in the sandbox environment for security.  
> **Your first task in VS Code is to generate and put the production secrets into `.env`.**

### Prompt to provide to VS Code GitHub Copilot:
```text
@copilot Please configure production environment keys for CMRG Survey.
Run `npm run keys:generate` to automatically generate high-entropy cryptographic secrets for:
- AUTH_SECRET (HS256 64-character entropy)
- DJANGO_SECRET_KEY
- SIMPLE_JWT_SIGNING_KEY
- CMRG_COLLECT_SYNC_SECRET (Mobile sync signature)
- STORAGE_SECRET_KEY (AES-256 GCM)
- POSTGRES_PASSWORD
- ADMIN_INITIAL_PASSWORD
And ensure DATABASE_URL points to our live PostgreSQL 16 cluster.
```

### Automated Single-Command Execution in VS Code:
```bash
# In VS Code terminal:
npm run keys:generate
```
This executes `scripts/generate-production-keys.js` which cryptographically generates high-entropy random keys via Node.js `crypto.randomBytes(32)` and writes a secured `.env` file directly at project root.

---

### Step-by-Step Production Sequence for Copilot / DevOps:

### Step 1: PostgreSQL Setup & Migration
1. Provision a PostgreSQL 15+ database (e.g. AWS RDS, Google Cloud SQL, or Neon).
2. Set `DATABASE_URL` in `.env`.
3. Apply `/database/schema.sql` using `psql` or the migration script:
   ```bash
   bash scripts/migrate-to-postgres.sh
   ```
4. In `/backend/db.ts`, switch `USE_POSTGRES=true` or install `pg` (`npm install pg @types/pg`) if deploying outside this container.

### Step 2: Backend Production Deployment
1. Build the production server bundle:
   ```bash
   npm run build
   ```
   *This compiles the frontend into `dist/` and bundles `server.ts` into a self-contained `dist/server.cjs` via esbuild.*
2. Start the production server:
   ```bash
   npm run start
   ```
3. Verify that `GET /api/health` returns `{"status":"ok"}`.

### Step 3: Android APK Generation (`CMRG Collect`)
1. Ensure Flutter 3.19+ and Android SDK API 34 are installed in your build environment.
2. Navigate to `/mobile`:
   ```bash
   cd mobile
   flutter pub get
   ```
3. To generate the debug APK for internal field testing:
   ```bash
   flutter build apk --debug
   ```
   *Artifact generated at: `mobile/build/app/outputs/flutter-apk/app-debug.apk`*
4. For production release:
   - Configure `mobile/android/key.properties` with your release keystore.
   - Run `flutter build apk --release` (or `flutter build appbundle` for Google Play / MDM distribution).

### Step 4: Verification & Smoke Testing
1. Run the test suite:
   ```bash
   npm test
   ```
2. Run simulated high-concurrency sync:
   ```bash
   npx tsx scripts/simulate-field-sync.ts
   ```
3. Confirm that all submissions appear in the Central Submissions Explorer and that the XLSX export is fully populated.

---

## 6. Clear Boundaries — What NOT to Break

1. **DO NOT change client-side submission UUID semantics:** The server relies on `clientSubmissionId` for idempotency. Changing this will cause duplicate records during intermittent connectivity reconnects.
2. **DO NOT remove the dual-engine fallback in `/backend/db.ts`:** Maintaining the file-based fallback allows local development and offline mock runs to continue working without requiring a local Postgres daemon.
3. **DO NOT touch the build script in `package.json`:** The bundled CJS output (`dist/server.cjs`) avoids ESM module resolution errors across Node versions in containerized deployment.
4. **DO NOT alter the `shared/formEngine.ts` expression grammar:** Mobile Dart and Web TypeScript share identical evaluation logic for `${variable}` references.
5. **DO NOT remove the developer credits:** The attribution to Afolabi Oluwadamilare Simeon and Samuel Korede must remain intact.
