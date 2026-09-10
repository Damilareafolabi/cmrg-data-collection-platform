# CMRG MVP end-to-end audit

Audit date: 2026-09-10

## Verified local execution

- Local server: `http://localhost:3000/`
- API health: `GET /api/health` returned `status: ok`, platform `CMRG Survey Platform`, mobile app `CMRG Collect`.
- Startup: `npm run dev` from the repository root.
- Typecheck: `npm run lint` passed.
- Automated tests: `npm run test` passed, 17 tests.
- Production bundle: `npm run build` passed.
- Browser smoke test: landing **GET STARTED** opens the server sign-in/registration page.
- Browser import smoke test: built-in XLSForm sample parses and opens **Review Imported Form**.

## Capability status

| Capability | Status | Evidence / blocker |
|---|---|---|
| Landing page | PASS | Existing `MarketingLanding` renders; GET STARTED routes to `WelcomePortal`. |
| Authentication | PARTIAL | Web login/registration APIs and portal exist; real organization deployment auth is not tested. |
| Projects | PASS | Existing project API and Projects view are connected to local development storage. |
| Questionnaire import | PASS | Drag/drop, browse, built-in sample and multipart API are connected. |
| XLSForm parsing | PASS | Survey/choices/settings, questions, groups, repeats, relevance, constraints and calculations map into the internal model. |
| Questionnaire builder | PASS | Existing builder supports add/edit/delete/reorder and save/publish actions. |
| Required fields | PASS | Shared engine and importer preserve required state; mobile/device behavior unverified. |
| Skip logic | PASS | Shared engine tests pass; real mobile execution unverified. |
| Constraints | PASS | Shared engine tests pass; real mobile execution unverified. |
| Calculations | PASS | Shared engine tests pass; real mobile execution unverified. |
| GPS | SOURCE IMPLEMENTED — DEVICE TEST REQUIRED | Android source uses runtime permissions and `Geolocator`; no device/emulator available. |
| Photo | SOURCE IMPLEMENTED — DEVICE TEST REQUIRED | Flutter camera capture and offline data-url storage are wired; no hardware test. |
| Audio | SOURCE IMPLEMENTED — DEVICE TEST REQUIRED | Flutter recorder and offline data-url storage are wired; no hardware test. |
| Preview/test | PASS | Web test runner exists; its hardware controls are intentionally browser simulation controls, not field evidence. |
| Publish/versioning | PARTIAL | Server persists published form versions; immutable/version-specific assignment acceptance test remains. |
| Enumerator management | PASS | User API and web management surfaces exist in local mode. |
| Assignment | PARTIAL | Deployment API/UI exists; enumerator-scoped Android download is not device-verified. |
| CMRG Collect | SOURCE PRESENT — DEVICE TEST REQUIRED | Flutter project exists; Flutter SDK and Android toolchain are unavailable. |
| Offline forms | SOURCE PRESENT — DEVICE TEST REQUIRED | Local form cache exists; no APK/device test. |
| Save/resume | SOURCE PRESENT — DEVICE TEST REQUIRED | Draft persistence exists; no restart/resume device test. |
| Offline queue | SOURCE PRESENT — DEVICE TEST REQUIRED | Local completed queue and client IDs exist; no device test. |
| Sync/idempotency | PARTIAL | Server sync and duplicate tests pass; mobile reconnect sync is not verified. |
| Real server submission | PASS IN API / DEVICE REQUIRED | `/api/submissions/sync` persists records in local storage; no real mobile submission generated. |
| Monitor/submissions | PARTIAL | Web submissions view reads API records; no fresh device record was produced. |
| Situation Room/review | PARTIAL | Review endpoint, notes and audit logging exist; media evidence workflow is not device-verified. |
| XLSX/CSV/JSON export | PASS IN API / DEVICE REQUIRED | Server exports real stored records and serializes structured answers; exact field submission export not tested. |
| Android APK | BLOCKED | Flutter, Dart, Java/JDK, Gradle, Android SDK, adb and Gradle wrapper unavailable. |
| PostgreSQL | ENVIRONMENT REQUIRED | Local development storage active; production PostgreSQL not connected. |
| HTTPS | ENVIRONMENT REQUIRED | Local HTTP verified; production TLS/domain not configured. |

## Known demo-only surfaces

The web FormTestRunner has explicit simulated GPS/media controls for browser logic testing. They are not used as proof of Android field capture. The landing-page visual telemetry and existing seeded local database records are demonstration fixtures, not newly collected field submissions.

## Exact blockers

1. Install Flutter/Dart, JDK 17, Android SDK/platform tools and connect an emulator or physical Android device.
2. Build and install the actual debug APK.
3. Run the complete device workflow: login, form download, offline interview, GPS, camera, audio, draft/resume, completion, reconnect and sync.
4. Confirm the resulting real submission in Monitor, Situation Room and XLSX export.
5. Configure PostgreSQL, HTTPS, production secrets and durable media storage for any client-facing pilot.

## Final status

**ENVIRONMENT TEST REQUIRED**

