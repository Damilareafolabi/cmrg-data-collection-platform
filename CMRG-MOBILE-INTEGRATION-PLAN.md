# CMRG mobile integration plan

Status: architecture proposal; implementation intentionally not started.

Recommended foundation: **ODK Collect**, subject to the approval gates in [OPEN-SOURCE-DEPENDENCY-AUDIT.md](./OPEN-SOURCE-DEPENDENCY-AUDIT.md).

## Target architecture

```text
CMRG Survey
  -> CMRG questionnaire model
  -> CMRG publish/version service
  -> CMRG backend mobile adapter
  -> CMRG Collect (ODK-based Android foundation)
  -> local offline database/draft queue
  -> CMRG submission sync adapter
  -> CMRG backend submissions
  -> Monitor / Situation Room
  -> XLSX, CSV, JSON exports
```

CMRG remains the system of record. The open-source mobile engine executes forms and stores work offline; it does not replace CMRG’s project, user, assignment, review, or export products.

## Integration boundaries

### 1. CMRG Survey to backend

Keep the existing workflow:

1. Create or import a questionnaire.
2. Convert it to the shared CMRG `Form`/`Question` model.
3. Edit, validate, preview, and save as a draft.
4. Publish an immutable form version.
5. Assign that version to an enumerator.

The published version must include a stable form ID, version ID, question names, types, choices, relevance, constraints, calculations, group metadata, and supported settings.

### 2. Backend form adapter

Add a narrowly scoped adapter, not a second questionnaire model:

```text
CMRG FormVersion
  -> ODK-compatible XForm/XML package
  -> media/choice-list references
  -> version metadata and CMRG form IDs
```

The adapter should:

- preserve CMRG variable names and choice values;
- convert supported CMRG types and expressions to XForms/JavaRosa equivalents;
- reject or warn on unsupported constructs rather than silently dropping them;
- embed a CMRG form/version identifier in the package metadata;
- expose a download endpoint restricted to the authenticated enumerator’s assignments;
- return the exact published version assigned, never the mutable draft.

### 3. CMRG Collect authentication

Use CMRG authentication as the authority:

1. Collect requests a CMRG session/token.
2. The backend validates the user role and device/session policy.
3. Form download lists only active assignments for that enumerator.
4. Submission sync uses the same authenticated session and project isolation.

Do not assume ODK Central accounts or credentials are available to CMRG users. The mobile adapter must isolate upstream engine authentication from CMRG identity.

### 4. Form download and local storage

The mobile app should:

- authenticate with CMRG;
- fetch assigned published form packages;
- verify form/version metadata;
- store the package in the mature local form store;
- render it without network access;
- expose draft/resume using the upstream engine;
- retain the CMRG assignment and version IDs with the local instance.

The first proof should use one simple questionnaire containing text, integer, yes/no, single choice, relevance, and required validation. Media and advanced constructs should follow after the basic execution path is stable.

### 5. Submission sync adapter

On completion:

1. Collect produces a completed instance using the upstream engine’s local queue.
2. The adapter adds CMRG metadata: project ID, form ID, version ID, enumerator ID, device ID, client submission ID, and timestamps.
3. The client sends the authenticated payload to the existing CMRG submission endpoint.
4. The backend validates the form/version and assignment.
5. The backend stores the submission idempotently by `clientSubmissionId`.
6. The server returns an acknowledgement and any retryable/permanent error.
7. The mobile queue marks the item synced only after acknowledgement.

Do not create a separate fake sync screen. Queue state must reflect the actual local record and server response.

### 6. Monitor and Situation Room

No replacement is required:

- Monitor reads the stored CMRG submission record.
- Situation Room opens the same record and its review metadata.
- GPS and media references are resolved through CMRG-controlled endpoints and access checks.
- Review status, flags, supervisor notes, and audit events remain backend records.

The UI must never show a submission as synced, reviewed, or approved unless the corresponding backend state exists.

### 7. Exports

Keep the existing CMRG export pipeline:

- flatten ordinary answers by stable variable name;
- serialize structured GPS/media values deliberately;
- preserve choice values and labels according to the chosen export contract;
- include form/version/enumerator/timestamps;
- test real mobile submissions against a golden expected XLSX;
- reject or clearly represent unsupported repeats/groups rather than producing misleading columns.

## Phased implementation plan

### Gate A — technology proof

Do not fork the full app yet. Build a small proof against a pinned upstream ODK Collect version and answer:

- Can the CMRG backend produce one valid XForm from one published CMRG form?
- Can the app download it from a CMRG endpoint?
- Can a CMRG token authorize the request?
- Can one completed instance be returned to CMRG?
- Can the backend map it to the existing submission model?

Acceptance: one real text/number/choice interview travels from CMRG Survey to Android and back without replacing current web functionality.

### Gate B — basic mobile alpha

Add:

- login;
- assigned-form list;
- download;
- text, number, choice, yes/no, date/time;
- required validation;
- relevance;
- draft/resume;
- completion and sync.

Acceptance: repeatable emulator and physical-device test with a real questionnaire and no data loss.

### Gate C — field capture

Add and test:

- offline operation;
- GPS;
- photo;
- audio;
- local media queue;
- retry and duplicate protection.

Acceptance: a physical-device offline interview syncs exactly once with retrievable evidence.

### Gate D — supervision and exports

Verify:

- Monitor record;
- Situation Room review;
- notes/flags/audit;
- XLSX/CSV/JSON export;
- no `[object Object]`;
- reconciliation against known answers.

## Maintenance model

CMRG should maintain a small integration layer and avoid unnecessary edits to mature upstream code. Every upstream update should record:

- upstream version/commit;
- security fixes included;
- CMRG patches;
- license/NOTICE changes;
- Android API/device test results;
- migration or rollback notes.

If a fork becomes necessary, keep CMRG changes in clearly separated commits or patches and regularly compare with upstream. Do not silently diverge.

## Risks and controls

| Risk | Control |
|---|---|
| XForms/CMRG model mismatch | Start with a constrained supported subset and explicit conversion warnings |
| Upstream authentication assumptions | Keep CMRG auth in the backend adapter |
| Duplicate submissions | Preserve client IDs and enforce backend idempotency |
| Media payload growth | Establish size limits and durable storage before pilot |
| License/notice omissions | Maintain an attribution and dependency manifest |
| Upstream breaking changes | Pin versions and run a mobile regression suite before updates |
| False readiness claims | Report browser/API/emulator/device/offline/real-data evidence separately |

## Current decision

Research recommends ODK Collect as the first foundation, but **no implementation, fork, dependency addition, or APK build should begin until CMRG approves this architecture and completes the license/POC gates**.
