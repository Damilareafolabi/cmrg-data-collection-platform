# CMRG Collect - Android Production Field App

CMRG Collect is the official Android survey and data collection field client for the **CMRG Survey Platform**. Built with Flutter and native Android components, it is engineered specifically for offline-first fieldwork in low-connectivity enumeration environments.

---

## 📱 Features

- **Offline-First Architecture**: Forms, draft answers, and finalized interviews persist safely in local SQLite storage.
- **Universal Dynamic Questionnaire Runner**: Supports text, integers, decimals, single choice, multiple choice, yes/no, ratings, rankings, GPS geopoints, photos, and repeat groups.
- **Dynamic Logic Engine**: Real-time skip logic evaluation, numeric constraint validation, and calculated fields.
- **Idempotent Synchronization Engine**: Client-generated UUIDs guarantee that network reconnects and repeated sync taps will never create duplicate submissions on the server.
- **Hardware Profile & GPS**: Captures location coordinates and device identifiers for data audit trails.

---

## 🛠 Prerequisites

- **Flutter SDK**: 3.19.x or later
- **Android Studio / SDK**: Android API 34 (compileSdk 34, minSdk 21)
- **Java Development Kit (JDK)**: JDK 17 (recommended for Gradle 8+)

---

## 🚀 Building the Android APK

### 1. Build Debug APK (For Immediate Device Testing)

```bash
cd mobile
flutter pub get
flutter build apk --debug
```

The output file will be generated at:
`mobile/build/app/outputs/flutter-apk/app-debug.apk`

You can install it directly to any connected Android phone or emulator via ADB:
```bash
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```

---

### 2. Build Production Release APK

#### Step A: Generate a Production Keystore (One-Time Setup)

```bash
keytool -genkey -v -keystore cmrg-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cmrg_collect
```

#### Step B: Create `key.properties`

In `mobile/android/key.properties`, add:
```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=cmrg_collect
storeFile=../cmrg-release.jks
```

#### Step C: Build the Signed Release APK

```bash
flutter build apk --release
```

The optimized, minified production APK will be created at:
`mobile/build/app/outputs/flutter-apk/app-release.apk`

---

## 🌐 Connecting to the CMRG Survey Server

1. **Android Emulator**: Set Server URL in Settings to `http://10.0.2.2:3000`
2. **Physical Device on Local Wi-Fi**: Set Server URL to `http://<YOUR_COMPUTER_LOCAL_IP>:3000`
3. **Cloud Production Deployment**: Set Server URL to `https://your-cmrg-domain.org`
