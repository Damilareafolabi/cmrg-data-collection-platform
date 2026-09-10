#!/usr/bin/env bash
# ========================================================
# CMRG Collect — Android APK Build Script
# ========================================================
set -e

BUILD_MODE="${1:-debug}"

echo "=== Building CMRG Collect Android Field Application ==="
echo "Target Mode: $BUILD_MODE"

cd mobile

echo "1. Resolving Flutter dependencies..."
flutter pub get

if [ "$BUILD_MODE" = "release" ]; then
  echo "2. Compiling production release APK..."
  flutter build apk --release
  echo "✓ Output: mobile/build/app/outputs/flutter-apk/app-release.apk"
else
  echo "2. Compiling debug testing APK..."
  flutter build apk --debug
  echo "✓ Output: mobile/build/app/outputs/flutter-apk/app-debug.apk"
fi

echo "=== Build Complete ==="
