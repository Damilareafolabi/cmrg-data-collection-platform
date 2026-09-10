# CMRG Survey baseline audit

Audit date: 2026-09-10

## Current architecture

- Web application: React 19 + Vite + TypeScript + Tailwind CSS.
- Application server: Express, bundled with esbuild from `server.ts`.
- Persistence: repository database abstraction with JSON-file fallback and PostgreSQL support.
- Shared domain model: `shared/types.ts`, including projects, forms, versions, deployments, submissions, devices and users.
- Mobile application: Flutter source in `mobile/`, with local persistence and offline sync services.
- Import engine: `backend/importers.ts`, exposed through `POST /api/import-form`, using SheetJS for workbook and delimited-file parsing.

## Verified working at baseline

- Type checking: `npm run lint` passes.
- Core engine tests: `npm run test` passes (13 tests).
- Production web and server build: `npm run build` passes.
- Existing UI surfaces include dashboard, projects, questionnaire library, form builder, test runner, deployments, submissions, CMRG Collect and import review.
- Import flow supports drag and drop, file browsing, XLSForm/Excel/CSV/TSV/JSON/XML/text parsing, editable review, test, builder handoff and form creation.

## Import hardening completed in this iteration

- Imports now receive a shared internal-model validation pass after format-specific parsing.
- Duplicate variable names are surfaced as validation errors.
- Missing labels and unsupported question types are surfaced instead of being silently treated as valid.
- Unknown relevance and calculation references are surfaced.
- Missing choice-list references are surfaced when XLSForm metadata is available.
- Group and repeat boundaries are checked for mismatches and unclosed structures.
- XLSForm settings, sheet names, choice-list names, media fields and GPS fields are retained in import metadata for review.
- Production form creation is disabled while blocking import validation errors remain; the builder remains available for correction.

## Known environment-dependent items

- PostgreSQL and production secrets require deployment-specific environment configuration.
- Android APK generation requires the local Flutter/Android toolchain and signing configuration.
- Browser camera, microphone and GPS capabilities require HTTPS and device permissions in deployment.
- Current UI includes simulated/demo users and fallback data for local development; real authentication and organization tenancy must be configured before production use.

## Recommended next production gates

1. Add authenticated organization and project scoping to every API route.
2. Run end-to-end import fixtures covering XLSForm groups, repeats, multilingual labels, constraints and choice filters.
3. Complete Situation Room operational views for live fieldwork monitoring and review workflows.
4. Provision managed PostgreSQL, object storage for media, TLS, backups and monitoring.
5. Build and sign CMRG Collect for a controlled Android pilot, then test offline sync against production-like connectivity.
