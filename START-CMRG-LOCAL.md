# Start CMRG Survey locally

This repository runs the CMRG Survey web frontend and Express API from one development server.

## Requirements

- Node.js 20+ or 22 LTS
- npm

The current workspace already contains `node_modules`, so dependency installation is normally only needed after a fresh checkout.

## First run or fresh checkout

Open PowerShell in the repository folder:

```powershell
Set-Location "C:\Users\LUMEN GLOB AL\Downloads\cmrg-data-collection-to-be-worked-on-vscode"
npm install
```

## Start the local application

```powershell
Set-Location "C:\Users\LUMEN GLOB AL\Downloads\cmrg-data-collection-to-be-worked-on-vscode"
npm run dev
```

Keep that PowerShell window open. The server starts both the API and the Vite frontend.

## Open the application

Open this exact URL in a browser:

**http://localhost:3000/**

The API health check is:

**http://localhost:3000/api/health**

## Verified demonstration path

From the running web app:

1. Select **CMRG Central**.
2. Select **Questionnaires & Import**.
3. Select **Import Existing Form**.
4. Select the built-in **XLSForm (.xlsx)** sample.
5. Confirm that the parser opens **Review Imported Form**.

This path was verified locally on 2026-09-10.

## Stop the application

Press `Ctrl+C` in the PowerShell window running `npm run dev`.

## Useful verification commands

```powershell
npm run lint
npm run test
npm run build
```

## CMRG Collect Android note

The Android project is in `mobile\`, but this workstation currently does not have Flutter, Dart, Java/JDK, Gradle, Android SDK, or `adb`. No APK is available from this environment until the Android toolchain is installed.
