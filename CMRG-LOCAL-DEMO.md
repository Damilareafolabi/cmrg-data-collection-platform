# CMRG local MVP demonstration

## Start

Open PowerShell and run:

```powershell
Set-Location "C:\Users\LUMEN GLOB AL\Downloads\cmrg-data-collection-to-be-worked-on-vscode"
npm run dev
```

Keep that window open.

## Web

Open: [http://localhost:3000/](http://localhost:3000/)

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Demonstration flow

1. Landing page
2. Select **GET STARTED**
3. Use **Sign In** or **Register User** on the server page
4. Open **CMRG Central**
5. Open **Questionnaires & Import**
6. Select **Import Existing Form**
7. Drop/browse an XLSForm, or select the built-in **XLSForm (.xlsx)** sample
8. Confirm **Review Imported Form**
9. Choose **Edit in Form Builder**
10. Use **Test Form Logic** / preview
11. Save Draft
12. Publish Version
13. Open **Field Deployments** and assign the published form
14. Open **Submissions & QA** for server-backed review and export actions

The built-in import path was verified locally on 2026-09-10.

## Mobile

The source project is in `mobile\`.

If the Android toolchain is installed:

```powershell
Set-Location "C:\Users\LUMEN GLOB AL\Downloads\cmrg-data-collection-to-be-worked-on-vscode\mobile"
flutter pub get
flutter build apk --debug
```

Expected debug APK path:

`mobile\build\app\outputs\flutter-apk\app-debug.apk`

No APK exists from this workstation because Flutter, Dart, Java/JDK, Gradle, Android SDK and adb are not installed.

## Android backend address

- Android emulator: `http://10.0.2.2:3000`
- Physical Android device on the same LAN: use the Windows computer's LAN IP, for example `http://192.168.1.20:3000`
- Production: use an HTTPS deployment URL, not localhost.

## Verification

| Item | Status |
|---|---|
| Local web server | PASS |
| API health | PASS |
| Landing GET STARTED to signup/login | PASS |
| XLSForm import to review | PASS |
| Web builder | PASS |
| Web publish/deployment surfaces | PARTIAL |
| Flutter source | PASS |
| APK build | BLOCKED — toolchain missing |
| Android login/download | ENVIRONMENT TEST REQUIRED |
| Offline interview | ENVIRONMENT TEST REQUIRED |
| GPS hardware | ENVIRONMENT TEST REQUIRED |
| Photo hardware | ENVIRONMENT TEST REQUIRED |
| Audio hardware | ENVIRONMENT TEST REQUIRED |
| Draft/resume device test | ENVIRONMENT TEST REQUIRED |
| Reconnect sync | ENVIRONMENT TEST REQUIRED |
| Real Monitor submission | ENVIRONMENT TEST REQUIRED |
| Situation Room real evidence | ENVIRONMENT TEST REQUIRED |
| XLSX from real mobile submission | ENVIRONMENT TEST REQUIRED |
| PostgreSQL | ENVIRONMENT TEST REQUIRED |
| HTTPS | ENVIRONMENT TEST REQUIRED |

## Honest status

**ENVIRONMENT TEST REQUIRED**

The local web/import demonstration is ready. A real CMRG fieldwork demonstration requires the Android toolchain and an emulator or physical device before the mobile workflow can be claimed as verified.
