#!/usr/bin/env bash
# Life Gamify — Run Android App on Connected Device / Emulator

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/orchestrator.sh"

verify_workspace

log_info "Building and running Android application..."
"$SCRIPT_DIR/build-android.sh"

cd "$ANDROID_DIR"

if command -v adb >/dev/null 2>&1; then
  DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')
  if [[ "$DEVICE_COUNT" -gt 0 ]]; then
    log_info "Installing debug APK to connected device..."
    adb install -r app/build/outputs/apk/debug/app-debug.apk
    log_info "Launching Life Gamify on device..."
    adb shell am start -n com.lifegamify.app.debug/com.lifegamify.app.MainActivity
    log_success "App launched on Android device!"
  else
    log_warn "No running Android emulator or device found. Launch an emulator via Android Studio or run 'emulator @<avd_name>'."
  fi
else
  log_warn "adb command not found. Ensure ANDROID_HOME/platform-tools is in PATH."
fi

log_success "Starting Vite local development server for live-reloading..."
cd "$ROOT_DIR"
npm run dev
