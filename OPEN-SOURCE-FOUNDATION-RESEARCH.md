# CMRG Collect open-source foundation research

Research date: 2026-09-10

## Decision context

CMRG should keep its existing CMRG Survey web application, CMRG backend, questionnaire model, publishing, assignment, Monitor, Situation Room, and exports. The mobile foundation should solve difficult field-collection problems without forcing CMRG to copy a proprietary SurveyCTO implementation or prematurely rebuild a mature Android engine.

The candidates below were evaluated from their official repositories and project documentation. “Supported” means the capability is present in the candidate ecosystem; it does not mean it is already integrated with CMRG.

## Candidate comparison

| Project | License | Primary language | Android | XLSForm/form model | Offline | GPS/photo/audio | Draft/resume | Sync |
|---|---|---|---|---|---|---|---|---|
| ODK Collect | Apache-2.0 | Java/Kotlin; JavaRosa | Native Android | ODK XForms/JavaRosa; XLSForm ecosystem | Core capability | Yes | Yes | ODK Central/Aggregate and compatible servers |
| KoboCollect | Apache-2.0 | Java/Kotlin; based on ODK Collect/JavaRosa | Native Android | XLSForm-first KoBo ecosystem | Core capability | Yes | Yes | KoBo server workflows and APIs |
| Survey Solutions | World Bank Community License Agreement | C#/.NET | Native Android clients | Survey Solutions questionnaire model, not XLSForm-first | Core capability | Yes | Yes | Headquarters/supervisor/interviewer platform |
| CommCare Android | Apache-2.0 | Java/Kotlin; CommCare Core | Native Android | XForms/CommCare model, not XLSForm-first | Core capability | Yes | Yes | CommCare/HQ-oriented sync |

## 1. ODK Collect

- **Project:** ODK Collect
- **Repository:** [getodk/collect](https://github.com/getodk/collect)
- **License:** Apache License 2.0
- **Primary language:** Java/Kotlin Android application with JavaRosa form logic
- **Android support:** Mature native Android client
- **Offline capability:** A primary design goal; forms and in-progress interviews work without connectivity
- **XLSForm capability:** Strong ODK XForms/JavaRosa foundation and broad XLSForm ecosystem compatibility
- **GPS:** Built in
- **Photo:** Built in
- **Audio:** Built in
- **Save/resume:** Built in
- **Sync:** Established submission workflows through ODK Central, Aggregate, and compatible services
- **Maturity:** Long-running, widely used open-source field-collection project with active maintenance and release planning
- **What CMRG would reuse:** Android form rendering, relevance, constraints, calculations, repeats/groups, local persistence, media capture, permissions, draft/resume, queueing, and submission transport patterns
- **What CMRG would rewrite/adapt:** CMRG login/session integration, assignment endpoint, form download adapter, CMRG questionnaire-to-XForms conversion, submission payload adapter, CMRG branding, and links to Monitor/Situation Room
- **Integration difficulty:** Medium to high. It is not a drop-in Flutter package; the integration boundary should be an Android/native application or a carefully maintained fork plus a CMRG server adapter.
- **License obligations:** Preserve Apache-2.0 notices and license text; retain copyright and NOTICE material where applicable; document modifications; check every added dependency separately.
- **Risks:** ODK Collect is an application/ecosystem rather than a small embeddable SDK. CMRG must choose whether to publish ODK-compatible forms/submissions or maintain an adapter layer.
- **Recommendation:** **Top candidate for CMRG Collect.** It is the best balance of generic survey capability, XLSForm compatibility, offline reliability, media support, Android maturity, and permissive licensing.

## 2. KoboCollect

- **Project:** KoboCollect
- **Repository:** [kobotoolbox/collect](https://github.com/kobotoolbox/collect)
- **License:** Apache License 2.0
- **Primary language:** Java/Kotlin Android application based on ODK Collect and JavaRosa
- **Android support:** Native Android client
- **Offline capability:** Core fieldwork capability
- **XLSForm capability:** Strong XLSForm-first workflow through the KoBoToolbox ecosystem
- **GPS:** Built in
- **Photo:** Built in
- **Audio:** Built in
- **Save/resume:** Supported
- **Sync:** Designed around KoBo server forms and submissions, with API integration options
- **Maturity:** Active and field-proven ecosystem
- **What CMRG would reuse:** Much of the same mature ODK/JavaRosa-style form, offline, media, and synchronization behavior
- **What CMRG would rewrite/adapt:** CMRG authentication, assignment, server URL and form/submission adapters, CMRG branding, and CMRG supervision/export integration
- **Integration difficulty:** Medium to high, but potentially lower if CMRG adopts KoBo-compatible form/submission conventions
- **License obligations:** Preserve Apache-2.0 notices, copyright, NOTICE material, and dependency obligations; document modifications
- **Risks:** The app and surrounding workflows are more KoBo-shaped than vendor-neutral. CMRG could become coupled to KoBo server assumptions or spend time removing platform-specific behavior.
- **Recommendation:** **Strong second choice.** Prefer it only if CMRG intentionally wants to align with KoBo’s server/form conventions rather than maintain a more neutral CMRG adapter.

## 3. Survey Solutions

- **Project:** Survey Solutions
- **Repository:** [surveysolutions/SurveySolutions](https://github.com/surveysolutions/SurveySolutions)
- **License:** World Bank Community License Agreement; this is not the same as a standard permissive Apache/MIT license
- **Primary language:** C#/.NET, with Android Interviewer/Supervisor/Tester applications in the broader codebase
- **Android support:** Native Android field applications
- **Offline capability:** Strong interviewer-oriented offline operation
- **XLSForm capability:** Not XLSForm-first; uses its own questionnaire authoring/model ecosystem
- **GPS:** Supported
- **Photo:** Supported
- **Audio:** Supported where configured by the survey model
- **Save/resume:** Supported
- **Sync:** Headquarters, supervisor, and interviewer workflow
- **Maturity:** Mature, actively maintained survey platform
- **What CMRG would reuse:** Proven field operations, interviewer workflow, offline storage, media, supervisor controls, and synchronization concepts
- **What CMRG would rewrite/adapt:** A large portion of CMRG’s model and server integration if XLSForm compatibility and the existing CMRG backend remain requirements
- **Integration difficulty:** High. It is a complete platform rather than a small collection engine.
- **License obligations:** Carefully review and comply with the World Bank Community License Agreement before distribution or modification; obtain legal review for commercial CMRG use and redistribution.
- **Risks:** License restrictions, architectural weight, non-XLSForm-first model, and large divergence from the current CMRG backend
- **Recommendation:** **Do not use as the first CMRG Collect foundation.** It is worth studying for operational patterns, but it would create unnecessary integration and licensing risk for this product.

## 4. CommCare Android

- **Project:** CommCare Android
- **Repository:** [dimagi/commcare-android](https://github.com/dimagi/commcare-android)
- **License:** Apache License 2.0
- **Primary language:** Java/Kotlin Android application with CommCare Core
- **Android support:** Production Android client
- **Offline capability:** Core capability for frontline workflows
- **XLSForm capability:** Not XLSForm-first; centered on XForms and the CommCare case-management model
- **GPS:** Supported
- **Photo:** Supported
- **Audio:** Supported
- **Save/resume:** Supported for workflows and case forms
- **Sync:** Strong, but closely coupled to CommCare/HQ concepts
- **Maturity:** Mature and actively maintained
- **What CMRG would reuse:** Offline workflows, multimedia, permissions, form execution, and robust frontline patterns
- **What CMRG would rewrite/adapt:** Most server, identity, form packaging, assignment, and submission boundaries for the existing CMRG backend
- **Integration difficulty:** High for a generic questionnaire product; lower only if CMRG later adopts case-management semantics
- **License obligations:** Preserve Apache-2.0 notices and copyright/license files; document modifications and audit transitive dependencies
- **Risks:** Strong coupling to CommCare case management and backend assumptions; unnecessary complexity for the initial CMRG basic questionnaire workflow
- **Recommendation:** **Not the first foundation.** Reconsider for a later CMRG case-management phase.

## Recommendation

### BEST FOUNDATION FOR CMRG COLLECT: ODK Collect

ODK Collect is the best initial foundation because:

1. It is designed for real-world offline Android fieldwork.
2. Its JavaRosa/XForms engine maps closely to the existing CMRG questionnaire concepts: question types, relevance, constraints, calculations, groups, repeats, and media.
3. GPS, camera, audio, permissions, local drafts, resume, and submission workflows are already mature problems in its ecosystem.
4. Apache-2.0 is comparatively permissive for a CMRG-controlled product, provided notices and license obligations are preserved.
5. It is more neutral than KoboCollect and less platform-heavy than Survey Solutions or CommCare.
6. CMRG can keep its backend and expose an adapter rather than replacing the CMRG Survey product.

This recommendation is architectural, not an approval to fork immediately. Before implementation, CMRG should prototype the smallest integration boundary:

```text
CMRG Form model
  -> CMRG XLSForm/XForm adapter
  -> ODK-compatible mobile form package
  -> ODK-style completed instance
  -> CMRG submission adapter
  -> existing Monitor/Situation Room/export paths
```

## What remains unverified

- Exact ODK Collect version and Android API/device matrix for the eventual CMRG build
- Exact effort required to replace ODK Central authentication with CMRG authentication
- Whether CMRG should maintain a fork or build a thin companion/adapter
- Media storage and payload limits in the current CMRG backend
- Legal review of all third-party dependencies before distribution

No candidate was copied, forked, or added to the repository during this research.
