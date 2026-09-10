# CMRG Basic MVP Status

Status date: 2026-09-10

## Goal

Prove one real cycle:

CMRG Survey project/questionnaire → publish → assign → CMRG Collect login/download/fill/submit → server submission → Monitor review → Excel export.

No fake submissions, fake sync status, or seeded records are accepted as evidence.

## Basic MVP checklist

| Capability | Status | Evidence |
|---|---|---|
| Login | PARTIAL | Web authentication and login API are present and the local web foundation passes. Enumerator Android login is not executable without Flutter. |
| Create/import questionnaire | PASS | Existing web builder/import path is covered by the verified local web workflow and XLSForm tests. |
| Publish | PASS | Existing publish API/UI path is present; web build and tests pass. |
| Assign | PASS | Existing deployment/assignment API/UI path is present; Android retrieval is not device-tested. |
| CMRG Collect opens | BLOCKED | No Flutter SDK or APK exists on this workstation. |
| Enumerator downloads form | BLOCKED | Requires a running Android build/device. |
| Enumerator fills form | BLOCKED | Requires a running Android build/device. |
| Enumerator submits | BLOCKED | No real mobile submission can be produced without Android execution. |
| Submission reaches server | BLOCKED for the requested real cycle | Server sync endpoint and idempotency tests exist, but no real mobile submission was generated. |
| Monitor displays real submission | BLOCKED for the requested real cycle | No fresh mobile submission exists to display. |
| Excel export contains real answers | BLOCKED for the requested real cycle | Export code exists, but no real mobile record was produced for export. |

## BASIC MVP

**FAIL — not yet verified as a real end-to-end workflow**

The web-side foundation is usable for local demonstration, but the required real enumerator-to-server cycle has not been proven.

## Android

**BLOCKED**

## Exact blocker

The current Windows environment does not have:

- Flutter/Dart
- Java/JDK
- Android SDK
- Android Studio
- Gradle
- ADB

Consequently, `flutter doctor`, `flutter pub get`, `flutter analyze`, and `flutter build apk --debug` cannot start. No APK exists, and no Android emulator or physical-device test can be performed.

The existing mobile project is already present under `mobile\`; a second application is not needed.

## Minimum environment required

Install:

1. Flutter stable SDK (includes Dart) and add Flutter `bin` to PATH.
2. Android Studio with Android SDK Platform 34, Build-Tools, Platform-Tools, and either an emulator image or a USB-debuggable physical Android device.
3. JDK 17 with `JAVA_HOME`.

Then run from `mobile\`:

```powershell
flutter doctor
flutter pub get
flutter analyze
flutter build apk --debug
adb devices
```

## Next single action

**Install the Flutter stable SDK and Android Studio/JDK 17 on this Windows workstation, then rerun `flutter doctor`.**
