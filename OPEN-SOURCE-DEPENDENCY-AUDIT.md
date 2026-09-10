# CMRG open-source dependency audit

Audit date: 2026-09-10

This audit records candidates considered for CMRG Collect before any code is incorporated. No third-party source has been copied or forked as part of this audit.

| Project | Repository | License | What we would reuse | What we would rewrite | Integration difficulty | License obligations | Recommendation |
|---|---|---|---|---|---|---|---|
| ODK Collect | https://github.com/getodk/collect | Apache-2.0 | Android form engine, JavaRosa/XForms execution, offline drafts, GPS, photo, audio, permissions, queue/sync patterns | CMRG auth, assignment, form packaging adapter, submission adapter, branding, Monitor/Situation Room links | Medium-high | Preserve Apache license, copyright, NOTICE files, and dependency notices; document modifications | **Preferred foundation** |
| KoboCollect | https://github.com/kobotoolbox/collect | Apache-2.0 | ODK-derived mobile execution, XLSForm workflow, offline/media/sync behavior | CMRG backend/auth/assignment and KoBo-specific assumptions | Medium-high | Preserve Apache license, copyright, NOTICE files, and dependency notices; document modifications | Strong alternative if aligning with KoBo conventions |
| Survey Solutions | https://github.com/surveysolutions/SurveySolutions | World Bank Community License Agreement | Mature interviewer/supervisor workflows, offline operation, media, synchronization | XLSForm adapter and substantial backend/model integration | High | Review and comply with the specific Community License Agreement; obtain legal review before commercial redistribution or modification | Study only; not first foundation |
| CommCare Android | https://github.com/dimagi/commcare-android | Apache-2.0 | Mature offline frontline workflows, media, permissions, form execution | Case/HQ coupling, identity, assignment, form and submission adapters | High | Preserve Apache license, copyright, NOTICE files, and dependency notices; document modifications | Reserve for later case-management needs |

## Audit conclusions

- Apache-2.0 is not “no obligations.” CMRG must preserve notices, license text, copyright statements, and dependency notices as required.
- A permissive license does not remove the need to audit trademark, branding, patents, security, and transitive dependencies.
- The World Bank Community License Agreement needs legal review before CMRG considers redistribution or modification.
- CMRG must not describe third-party engine work as wholly written by CMRG.
- The selected foundation should be recorded in the repository, with its upstream URL, commit/tag, license files, modifications, and update process.

## Approval gate before incorporation

Before adding any candidate:

1. Confirm the exact upstream commit/tag and license files.
2. Perform a legal/license review for the intended CMRG distribution model.
3. Build a proof of concept that downloads one CMRG-published questionnaire and returns one real submission.
4. Confirm the adapter does not require replacing CMRG Survey, Monitor, Situation Room, or exports.
5. Decide whether CMRG will maintain a fork or an adapter/service boundary.
6. Record upstream update, security-patch, and attribution procedures.
