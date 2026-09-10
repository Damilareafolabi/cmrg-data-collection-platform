# CMRG Product Roadmap

This roadmap defines a reliability-first progression for CMRG Survey, CMRG Collect, and CMRG Situation Room. It intentionally prevents the product from expanding faster than it can be tested with real users, devices, and data.

## Product development rule

Every capability follows this sequence:

**BUILD → TEST → FIX → RE-TEST → DOCUMENT → PILOT → IMPROVE → ONLY THEN MOVE ON**

Source code is not evidence of field readiness. A capability may be marked implemented while remaining untested in a browser, through the API, on Android, offline, or with real project data.

## Evidence levels

Each major capability should be reported using these separate stages:

| Evidence level | Meaning |
|---|---|
| IMPLEMENTED | The code path exists and has been inspected. |
| TESTED IN BROWSER | A repeatable browser test has passed. |
| TESTED WITH API | A real request and response has been verified. |
| TESTED ON ANDROID EMULATOR | The compiled app has run on an emulator. |
| TESTED ON PHYSICAL DEVICE | The compiled app has run on a real Android device. |
| TESTED OFFLINE | The workflow has been tested with connectivity unavailable. |
| TESTED WITH REAL DATA | The workflow used an actual questionnaire and collected submission. |
| READY FOR PILOT | CMRG has completed internal testing and accepted the known limitations. |

Only claim the levels that have actually happened.

## Current baseline

The current repository has a working local web foundation and an existing Flutter project under `mobile\`. Web typecheck, core tests, production build, local API health, authentication routing, and XLSForm import/review have been verified. Flutter compilation, APK generation, Android execution, offline collection, and real mobile synchronization remain environment-blocked until the Android toolchain and a test device are available.

Current evidence status is recorded in [ANDROID-LOCAL-DEMO.md](./ANDROID-LOCAL-DEMO.md) and [CMRG-MVP-END-TO-END-AUDIT.md](./CMRG-MVP-END-TO-END-AUDIT.md).

---

## Version 0.1 — Internal Prototype

### Scope

Establish a dependable web workflow for creating a project, building or importing a questionnaire, validating it, previewing it, publishing a version, managing users, and assigning work.

### Features

- Authentication and basic roles
- Users, enumerators, supervisors, and projects
- Questionnaire creation and editing
- XLSForm/Excel import with an editable internal representation
- Questions required for the initial prototype: text, number, choice, yes/no, date/time
- Sections/groups
- Required fields, basic relevance, constraints, and calculations
- Browser preview and test runner
- Publishing and form version records
- Enumerator management and assignment
- Local development API and storage

### Tests required

- Browser smoke tests for create, import, edit, validate, preview, publish, and assign
- API tests for authentication, project isolation, form versioning, and assignment
- Regression tests for XLSForm parsing and validation
- Negative tests for invalid questionnaires and unauthorized access
- Repeatable test questionnaire with known expected structure

### Known limitations

- Local development storage is not a production database
- Android execution is not part of this version
- Browser media controls are simulations, not hardware evidence
- Advanced XLSForm types and complex workflows are out of scope

### Acceptance criteria

- A CMRG staff member can create a project and questionnaire without developer intervention
- An existing supported XLSForm becomes editable questionnaire data, not merely an uploaded file
- Invalid imports identify actionable errors
- A published form has a traceable version
- An enumerator can be created and assigned a published form
- Browser/API tests pass consistently

### Must not be added yet

- Advanced analytics or dashboards
- Case management
- SSO and enterprise integrations
- Complex repeat/dynamic-choice support
- Multimedia capture
- Production deployment claims

---

## Version 0.2 — Mobile Alpha

### Scope

Run the existing CMRG Collect Flutter application on Android and complete a basic assigned questionnaire.

### Features

- Enumerator login
- Configurable backend URL
- Authenticated assigned-form download
- Local form cache
- Offline-capable basic rendering
- Text, number, choice, yes/no, and date/time inputs
- Required-field validation
- Basic relevance/skip logic
- Save draft, reopen, resume, and complete

### Tests required

- `flutter doctor`, dependency resolution, static analysis, and debug APK build
- Android emulator smoke test
- Login and authenticated-session test
- Assigned-form download test
- Form rendering and answer persistence test
- Required validation and skip-logic test
- Draft close/reopen/resume test
- Complete-interview local persistence test
- API request logging or test-server verification without exposing credentials

### Known limitations

- Offline synchronization is not yet accepted as stable
- GPS, photo, audio, and media storage are deferred
- Emulator results do not substitute for physical-device results
- Production signing and deployment are out of scope

### Acceptance criteria

- A debug APK builds from the repository
- The app launches on an emulator
- An authenticated enumerator downloads an assigned form
- Basic answers validate and persist across a draft restart
- A completed interview is stored locally without data loss
- The same test passes twice from a clean app state

### Must not be added yet

- Advanced question types
- Multimedia fieldwork
- Supervisor dashboards
- Production infrastructure
- Broad UI redesign

---

## Version 0.3 — Offline Fieldwork Alpha

### Scope

Prove reliable offline save/resume, completion, local queueing, reconnect, and synchronization.

### Features

- Offline form access after download
- Draft persistence and resume
- Completed-submission queue
- Connectivity-aware sync
- Retry after transient failure
- Server acknowledgement
- Client submission ID idempotency
- Duplicate protection
- Clear queued, uploading, failed, and synced states

### Tests required

- Emulator and physical-device offline tests
- Network disabled during draft and completion
- App restart while a draft exists
- App restart with queued submissions
- Reconnect and sync test
- Server failure and retry test
- Duplicate sync request test
- Backend record-count and payload-integrity verification
- Recovery test after app interruption

### Known limitations

- Media attachments are deferred until the queue is proven with ordinary answers
- Device-specific power and OS background behavior may remain untested
- Production-scale queue volume is not yet established

### Acceptance criteria

- An enumerator completes an interview with no network after form download
- Drafts and completed records survive app restart
- Reconnection uploads the record exactly once
- A failed upload remains retryable and does not lose answers
- The backend record matches the local record
- CMRG can repeat the workflow on at least two test devices

### Must not be added yet

- GPS/photo/audio as a release gate
- Complex synchronization orchestration
- Large-scale analytics
- New advanced survey features that could destabilize the queue

---

## Version 0.4 — Multimedia Fieldwork

### Scope

Add and verify field media capture on real Android hardware.

### Features

- GPS capture with accuracy and timestamp
- Camera photo capture
- Audio recording
- Local media association with a submission
- Media-aware offline queue
- Media upload and retry
- Safe media references in review and export

### Tests required

- Permission-denied and permission-granted tests
- GPS capture indoors/outdoors where practical
- Camera capture and app restart recovery
- Audio recording, stop, playback/verification, and recovery
- Offline media capture
- Reconnect upload with interrupted transfer
- Duplicate protection for media-bearing submissions
- Device storage and large-file behavior
- Verification that exports never contain `[object Object]`

### Known limitations

- Device hardware differs by manufacturer
- Media size, retention, and durable storage policy must be agreed before production
- Browser simulation is not evidence for this version

### Acceptance criteria

- A physical Android device completes a media-bearing interview offline
- GPS, photo, and audio are all linked to the correct submission
- Reconnection synchronizes the submission and media without duplication
- Reviewers can retrieve the captured evidence
- Failures are visible and recoverable

### Must not be added yet

- Advanced media processing
- Automatic transcription or AI review
- Broad device support claims without device testing
- Production readiness claims before storage/security review

---

## Version 0.5 — Supervisor Pilot

### Scope

Use real submissions from CMRG Collect for monitoring, review, notes, flags, and auditability.

### Features

- Monitor based on actual backend submissions
- Submission details
- Enumerator and submission status
- GPS and media review
- Supervisor notes
- Review and flag actions
- Basic audit trail
- Project/user access isolation

### Tests required

- Real submission from each supported collection path
- Monitor record identity and status verification
- Review action persistence test
- Supervisor note persistence test
- Flag and unflag test
- Unauthorized project/submission access tests
- Media playback/viewing test
- Audit event verification

### Known limitations

- Advanced dashboards and workflow automation are deferred
- Situation Room scope remains focused on verification, not enterprise analytics
- Real pilot volume and operational support are not yet proven

### Acceptance criteria

- A supervisor can find a real submission by ID/project/form/enumerator
- Answers, GPS, photo, audio, timestamp, and sync state are accurate
- Review notes and status changes persist after reload
- Access boundaries prevent cross-project exposure
- CMRG can operate a controlled internal pilot

### Must not be added yet

- Enterprise analytics
- Complex case management
- Broad integrations
- Unverified status dashboards or simulated metrics

---

## Version 0.6 — Data Export

### Scope

Make exports dependable for known questionnaires and real collected data.

### Features

- XLSX export
- CSV export
- JSON export
- Stable variable names
- Correct choice values and labels
- GPS fields
- Media references and metadata
- Group/repeat handling within the supported scope
- Export filtering and metadata

### Tests required

- Golden questionnaire with expected export files
- Real mobile submission export
- Multiple choice and missing-value tests
- Choice value/label verification
- GPS/media serialization verification
- Group/repeat fixture tests
- Excel open/read-back verification
- CSV encoding and delimiter verification
- Regression test proving no `[object Object]`

### Known limitations

- Unsupported advanced XLSForm constructs must be reported, not silently flattened
- Large exports and background jobs may remain future work
- Export format changes require versioned documentation

### Acceptance criteria

- Exported XLSX opens successfully
- Known answers appear in the correct columns and values
- GPS and media references are readable and traceable
- No structured answer becomes `[object Object]`
- Repeated exports of unchanged data are deterministic

### Must not be added yet

- Advanced reporting
- Unvalidated statistical transformations
- Silent compatibility fallbacks
- Claims of universal SurveyCTO export parity

---

## Version 0.7 — Security & Infrastructure

### Scope

Move the proven workflow from local development toward controlled deployment.

### Features

- PostgreSQL production database
- HTTPS
- Secure secrets and token handling
- Durable media storage
- Backups and restore procedures
- Project and tenant isolation
- Permission enforcement
- Audit logging
- Database migrations
- Monitoring and error reporting
- Deployment and rollback procedures

### Tests required

- PostgreSQL migration and rollback tests
- Authentication/session and authorization review
- Project-isolation tests
- HTTPS and certificate verification
- Backup restore test
- Media retention and access-control test
- Rate limiting and abuse tests
- Dependency and secret scanning
- Failure/recovery and deployment rollback tests

### Known limitations

- Infrastructure reliability depends on the chosen hosting environment
- Security review must be performed before external client use
- Operational procedures must be owned by named CMRG staff

### Acceptance criteria

- Production data is stored in PostgreSQL with tested migrations
- Traffic is protected by HTTPS
- Backups can restore a known dataset
- Users cannot access unauthorized projects or media
- Monitoring detects API, sync, and storage failures
- A documented deployment and rollback procedure has been rehearsed

### Must not be added yet

- Large feature expansion during infrastructure migration
- Unreviewed third-party integrations
- Production use without restore and access-control evidence

---

## Version 1.0 — CMRG Production

### Scope

Operate a reliable CMRG-owned product for approved internal and client fieldwork.

### Features

- Stable supported web workflow
- Stable supported Android workflow
- Offline field collection
- GPS/photo/audio where approved
- Monitoring and review
- Reliable exports
- Production security and infrastructure
- Support, incident, backup, and release procedures
- Versioned documentation and training

### Tests required

- Full release regression suite
- Real internal field pilot
- Representative questionnaire and device matrix
- Offline and reconnect acceptance
- Security review
- Export reconciliation against known expected data
- Backup/restore drill
- User acceptance by CMRG field and supervision teams
- Release rollback rehearsal

### Known limitations

- Version 1.0 is still a supported scope, not automatic parity with SurveyCTO
- Unsupported features must be documented transparently
- New capabilities continue through the same build/test/pilot process

### Acceptance criteria

- CMRG completes repeated real fieldwork cycles without data loss
- Supervisors can review and export the resulting records
- Known failure modes have documented recovery steps
- CMRG accepts operational ownership and support responsibilities
- Pilot evidence supports the claim that the supported scope is reliable

### Must not be added yet

- Nothing is automatically included merely because it exists in SurveyCTO
- New advanced capabilities must not destabilize the supported production scope
- No “production-ready” claim without current evidence and CMRG acceptance

---

## Feature gate for future work

Before starting a new major feature, record:

1. Which roadmap version owns it.
2. The smallest supported scope.
3. The test questionnaire and expected result.
4. Browser/API/emulator/physical-device/offline/real-data evidence required.
5. Known failure and recovery cases.
6. The pilot owner and acceptance decision.

If the current version's acceptance criteria are not met, fix and re-test the current scope before expanding.
