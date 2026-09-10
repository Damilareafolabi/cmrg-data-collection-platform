# CMRG Survey

> **Professional Research Data Collection & Fieldwork Management Platform**  
> Owned and Operated by **Consumer & Market Research Group Ltd. (CMRG Ltd. RC378525)**  
> 
> **Product Team & Engineering Leadership:**  
> - **Afolabi Oluwadamilare Simeon** — Full Stack App Developer  
> - **Samuel Korede** — Full Stack App Developer & Brand Strategist  
> - *with the wider product, engineering, and creative team.*

---

## 1. Overview

**CMRG Survey** is an enterprise-grade survey research and data collection platform engineered specifically to meet the high-reliability demands of CMRG's commercial research fieldwork across FMCG, financial services, telecommunications, healthcare, and socioeconomic studies.

It replaces reliance on third-party subscription platforms (such as SurveyCTO and KoboToolbox), providing CMRG with:
- **Zero Recurring Software License Fees**: No per-enumerator or per-submission penalties.
- **100% Data Sovereignty**: All respondent answers, GPS coordinates, and media reside on CMRG-controlled servers.
- **Uncompromising Offline Field Capability**: Powered by the companion **CMRG Collect** native Android client.
- **Native XLSForm Interoperability**: Direct import of existing Excel questionnaires without tedious re-keying.
- **End-to-End Field Lifecycle**: From questionnaire design to deployment, offline collection, idempotent sync, QA review, and SPSS/Stata-ready export.

---

## 2. Platform Architecture & Monorepo Structure

```
cmrg-survey/
├── src/                    # Primary Web Frontend (React 19, Vite, Tailwind CSS v4)
│   ├── components/         # Modular views: Builder, Dashboard, Submissions, Collect
│   ├── lib/                # API client, offline IndexedDB storage, logic bindings
│   └── assets/             # Brand logos (CMRG RC378525), icons, patterns
├── backend/                # Server abstraction & database interfaces
│   ├── db.ts               # Dual-mode database (PostgreSQL + resilient JSON store)
│   ├── types.ts            # Core domain definitions
│   └── xlsxParser.ts       # XLSForm / Excel parser engine
├── mobile/                 # CMRG Collect Native Android Field Application
│   ├── lib/                # Flutter/Dart screens, SQLite service, offline engine
│   ├── android/            # Native Gradle configuration, AndroidManifest, ProGuard
│   └── pubspec.yaml        # Flutter mobile dependencies
├── database/               # Relational Database Definitions
│   ├── schema.sql          # Production PostgreSQL DDL with indexes & triggers
│   └── db_client.ts        # Database connection pool manager
├── shared/                 # Universal Business Logic
│   ├── formEngine.ts       # ODK skip logic, constraint, and calculation parser
│   └── types.ts            # Cross-platform shared TypeScript definitions
├── tests/                  # Automated Test Suite
│   └── run-tests.ts        # Engine validation (skip logic, constraints, sync dedupe)
├── scripts/                # Production Engineering & Migration Utility Scripts
│   ├── build-android-apk.sh
│   ├── migrate-to-postgres.sh
│   └── simulate-field-sync.ts
├── docs/                   # Production Architecture & Handoff Specifications
│   ├── COPILOT-PRODUCTION-HANDOFF.md
│   ├── PRODUCTION-CHECKLIST.md
│   ├── SURVEYCTO-CAPABILITY-MATRIX.md
│   └── TEST-PLAN.md
├── server.ts               # Express.js backend server entry point & Vite middleware
├── package.json            # Monorepo configuration & build scripts
└── .env.example            # Production environment variables template
```

---

## 3. Prerequisites

- **Node.js**: Version 20.x or 22.x LTS
- **npm**: Version 10.x+
- **PostgreSQL**: Version 15+ (for production database mode)
- **Flutter SDK**: Version 3.19.x+ (for compiling the Android APK)
- **Android Studio / Android SDK**: API Level 34

---

## 4. Quickstart: Development Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy the configuration template:
```bash
cp .env.example .env
```
*(In development, the server automatically defaults to resilient local storage if `DATABASE_URL` is omitted).*

### Step 3: Launch the Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:3000`. You will see the CMRG Survey console with immediate access to:
- **Central Overview Dashboard**
- **No-Code Form Builder & Drag & Drop XLSForm Importer**
- **Field Deployments & Enumerator Tracking**
- **Submissions Explorer & Quality Assurance QA Review**
- **CMRG Collect Field Emulator**
- **Public Marketing Website**

---

## 5. Running Automated Tests

Execute the comprehensive test suite:
```bash
npm test
```
This validates:
- Skip logic expression evaluation (`evaluateRelevance`)
- Range and boundary constraint validation (`validateConstraint`)
- Dynamic calculated fields (`evaluateCalculation`)
- Idempotent submission synchronization and duplicate detection

---

## 6. Building the Android Application (`CMRG Collect`)

To build the native Android field client:

```bash
cd mobile
flutter pub get

# 1. For debug APK (immediate testing on emulator or phone):
flutter build apk --debug

# 2. For signed production release APK:
flutter build apk --release
```
The output file is generated at `mobile/build/app/outputs/flutter-apk/app-debug.apk`.

Install directly to an Android phone via ADB:
```bash
adb install -r mobile/build/app/outputs/flutter-apk/app-debug.apk
```

---

## 7. Production Deployment (Web & Backend)

### Compile the Production Bundle
```bash
npm run build
```
This builds:
1. Optimized static assets into `dist/`
2. Standalone, self-contained server bundle into `dist/server.cjs` via `esbuild`

### Launch Production Container
```bash
npm start
```
Bind to port `3000` (or `PORT` environment variable) behind an Nginx or Cloud Run ingress proxy.

---

## 8. Handoff to VS Code + GitHub Copilot Agent

For the incoming production engineering team:
1. Open this repository in **VS Code**.
2. Review the four companion operational guides:
   - **`COPILOT-PRODUCTION-HANDOFF.md`**: Detailed step-by-step engineering roadmap.
   - **`PRODUCTION-CHECKLIST.md`**: Checkbox-based go-live readiness tracker.
   - **`SURVEYCTO-CAPABILITY-MATRIX.md`**: Feature-by-feature parity analysis.
   - **`TEST-PLAN.md`**: QA verification scenarios and stress benchmarks.
3. Apply PostgreSQL migrations using `bash scripts/migrate-to-postgres.sh`.
4. Run `npx tsx scripts/simulate-field-sync.ts` to verify high-concurrency ingestion.

---

## 9. Product Credits

- **Afolabi Oluwadamilare Simeon** — Full Stack App Developer  
- **Samuel Korede** — Full Stack App Developer & Brand Strategist  
- *and the wider product, engineering, and creative team.*  

© Consumer & Market Research Group Ltd. (CMRG Ltd. RC378525). All rights reserved.
