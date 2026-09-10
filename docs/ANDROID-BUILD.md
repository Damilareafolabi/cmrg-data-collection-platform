# CMRG Collect — Android Build & Release Engineering Guide

**Application:** CMRG Collect Mobile Field App  
**Platform:** Flutter 3.22 / Dart 3.4  
**Target OS:** Android 7.0+ (API 21 - API 34)  
**Package ID:** `org.cmrg.survey.collect`  
**Purpose:** Standalone APK build without Play Store dependencies for direct distribution to CMRG field enumerator phones.

---

## 1. Prerequisites

- **Flutter SDK:** 3.22.x stable channel (`flutter doctor`)
- **Android SDK:** Command-line Tools / Android Studio with SDK Platforms 34
- **Java Development Kit:** JDK 17 (OpenJDK or Corretto)

---

## 2. Fast Build Instructions

Navigate to the mobile directory:
```bash
cd mobile
flutter pub get
```

### Build Debug APK (For rapid field testing)
```bash
flutter build apk --debug
# Output location:
# mobile/build/app/outputs/flutter-apk/app-debug.apk
```

### Build Production Release APK (For production field deployment)
```bash
flutter build apk --release --split-per-abi
# Output location:
# mobile/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
# mobile/build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk
```

---

## 3. Keystore Signing Configuration

To sign the APK with CMRG's official release key:

1. Generate release keystore:
```bash
keytool -genkey -v -keystore cmrg-release.keystore -alias cmrg_field -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `mobile/android/key.properties`:
```properties
# Skipped in AI Studio sandbox; instructed for VS Code Copilot / DevOps to generate & configure
storePassword=YOUR_PRODUCTION_STORE_PASSWORD
keyPassword=YOUR_PRODUCTION_KEY_PASSWORD
keyAlias=cmrg_field
storeFile=cmrg-release.keystore
```

---

## 4. Hardware Frame Permissions Configured

- `ACCESS_FINE_LOCATION`: Required for GPS latitude, longitude, and accuracy recording.
- `CAMERA`: Required for household and product photo auditing.
- `RECORD_AUDIO`: Required for enumerator voice notes and passive interview audit snippets.
- `WRITE_EXTERNAL_STORAGE`: Required for caching blank forms and offline draft interviews in SQLite.
