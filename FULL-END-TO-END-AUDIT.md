# CMRG Survey + CMRG Collect full end-to-end audit

Audit date: 2026-09-10

## Evidence policy

This audit separates source-code verification from environment verification. Passing a TypeScript build does not prove a real Android device workflow, production database, media transfer, or HTTPS deployment.

## Requirement status

| Area | Status | Evidence / remaining work |
|---|---|---|
| XLSForm drag/drop and browse import | IMPLEMENTED AND VERIFIED | React import modal and `POST /api/import-form`; XLSForm fixture tests pass. |
| XLSForm conversion to internal model | IMPLEMENTED AND VERIFIED | Survey, choices, settings, groups, repeats, relevance, constraints, calculations and metadata are mapped into `Question`/`FormImportResult`. |
| Import validation | IMPLEMENTED AND VERIFIED | Duplicate names, missing labels, unsupported types, missing references, and malformed group/repeat boundaries are surfaced; 17 automated tests pass. |
| Import review and builder handoff | IMPLEMENTED BUT NOT VERIFIED | UI path exists; browser acceptance test still required. |
| Build-from-scratch | PARTIALLY IMPLEMENTED | Web builder supports question editing and publish calls; a full acceptance fixture from builder through mobile is not yet executed. |
| Preview/test engine | IMPLEMENTED BUT NOT VERIFIED | Web test runner and shared relevance/constraint/calculation engine exist; browser and mobile parity test required. |
| Form versioning | PARTIALLY IMPLEMENTED | Server stores form versions on publish, but immutable-version and assignment-isolation acceptance tests are still required. |
| Assignment/deployment | PARTIALLY IMPLEMENTED | Deployment API and UI exist; enumerator-scoped authorization and real device assignment download require verification. |
| CMRG Collect login | IMPLEMENTED BUT NOT VERIFIED | Flutter API client and login screen exist; Flutter toolchain is unavailable in this environment. |
| CMRG Collect form download | IMPLEMENTED BUT NOT VERIFIED | Flutter fetch/cache code exists; no device/emulator test available. |
| Generic offline rendering | PARTIALLY IMPLEMENTED | Generic question renderer, drafts and local completed queue exist; repeat, multiple-choice, photo and audio controls are incomplete in the inspected screen. |
| Offline drafts and resume | IMPLEMENTED BUT NOT VERIFIED | Shared-preference draft persistence and draft screen exist; real close/reopen device test required. |
| Required/relevance/constraint/calculation validation | IMPLEMENTED BUT NOT VERIFIED | Flutter interview invokes `FormEngine`; parity and device acceptance test required. |
| GPS capture | PARTIALLY IMPLEMENTED | Fixed coordinates were removed; the interview now requests permission and uses `Geolocator.getCurrentPosition`. Real device accuracy and persistence test are required. |
| Photo capture | IMPLEMENTED BUT NOT VERIFIED | Flutter interview now captures a camera image, stores it as a data URL in the offline answer payload, and queues it with the submission; real device/media-size testing remains required. |
| Audio capture | IMPLEMENTED BUT NOT VERIFIED | Flutter interview now records with `record`, stores the audio data URL in the offline answer payload, and queues it with the submission; real device/playback/media-size testing remains required. |
| Local submission queue | IMPLEMENTED BUT NOT VERIFIED | Completed queue and idempotent client IDs exist; interruption/retry test required. |
| Sync acknowledgement and duplicate prevention | PARTIALLY IMPLEMENTED | Server deduplicates via database method and mobile marks all pending IDs synced on any successful response; partial-batch and retry semantics need tests. |
| Sync backoff/interruption recovery | MISSING | No exponential backoff or durable per-item retry history was found in the inspected mobile sync path. |
| Real Monitor | PARTIALLY IMPLEMENTED | Web submissions/deployments views call APIs; a distinct verified Monitor/Situation Room evidence workflow is not present as a dedicated audited surface. |
| Situation Room evidence | PARTIALLY IMPLEMENTED | Submission detail/review exists on web; media persistence and audio playback from server records are not verified. |
| Review statuses and audit log | PARTIALLY IMPLEMENTED | Approved/rejected/flagged review endpoint exists; requested VERIFIED/NEEDS REVIEW/SUSPICIOUS vocabulary and end-to-end audit verification remain. |
| XLSX/CSV/JSON export | IMPLEMENTED BUT NOT VERIFIED | Server export endpoint builds real submission rows and codebook; fixture download and exact-record comparison are still required. |
| Authentication/password hashing/rate limiting | IMPLEMENTED BUT NOT VERIFIED | Auth service includes hashing, sessions and lockout; production authorization isolation audit remains. |
| RBAC and organization/project isolation | MISSING / BLOCKED | Default-user fallbacks and broad API routes exist; tenant/project enforcement must be implemented before pilot. |
| PostgreSQL production database | ENVIRONMENT REQUIRED | Repository includes PostgreSQL configuration/migrations, but no production PostgreSQL connection is available in this environment. |
| HTTPS, production secrets and media storage | ENVIRONMENT REQUIRED | Deployment credentials, domain/TLS, object storage and secret manager are external dependencies. |
| Android APK | ENVIRONMENT REQUIRED | Flutter and adb are not installed (`FLUTTER_NOT_FOUND`, `ADB_NOT_FOUND`); no APK was built or claimed. |
| Real Android device workflow | ENVIRONMENT REQUIRED | No emulator or physical device is available. |

## Changes made during this audit

- Removed simulated fixed GPS coordinates from CMRG Collect.
- Added runtime location-service and permission checks.
- Added high-accuracy device position capture with timestamp and measured accuracy.
- Added failure messaging when GPS cannot be captured.
- Added mobile controls for multiple choice, dropdown, date, time, camera photo and microphone audio capture.
- Updated export flattening so object answers such as GPS and media metadata are serialized as JSON.
- Preserved the existing web import hardening and regression coverage from the baseline pass.

## Verification executed

- `npm run lint`: passed.
- `npm run test`: passed (17 tests, including XLSForm settings, choices, group preservation and broken-reference validation).
- `npm run build`: passed for web and Express server.
- Flutter/Android tooling probe: Flutter SDK and adb unavailable, so mobile compilation and device behavior are not verified.

## Exact blockers before a real CMRG pilot

1. Install Flutter 3.22+/Dart and Android SDK/JDK 17, then run `flutter pub get`, `flutter analyze`, `flutter test`, and a debug APK build.
2. Test Flutter image/audio capture, local media persistence, media upload, server attachment linkage, and playback on a real device.
3. Add durable sync item states, retry/backoff, partial acknowledgement handling and conflict logging.
4. Enforce authenticated organization/project/user scope on every API route; remove default admin fallbacks for production.
5. Add acceptance tests for publish immutability, version-specific deployments, real review audit records and export equality.
6. Provision PostgreSQL, TLS, secure production secrets, durable media storage, backups and restore testing.
7. Run the complete offline workflow on a real Android device, including GPS, photo, audio, restart/resume and reconnect sync.

## Final status

**ENVIRONMENT TEST REQUIRED**

The codebase has a credible web/import foundation and passes its available automated verification, but the requested end-to-end real-device, media, production-database and deployment evidence is not available. CMRG should not yet stop relying on SurveyCTO for a live pilot based on this audit alone.
