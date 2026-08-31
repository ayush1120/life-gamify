#!/usr/bin/env bash
# Life Gamify — Build Android Layer & APK

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/orchestrator.sh"

verify_workspace

if [[ ! -d "$ANDROID_DIR" ]]; then
  log_error "Android directory not found at $ANDROID_DIR"
  exit 1
fi

"$SCRIPT_DIR/sync-assets.sh"

log_info "Compiling Android layer via Gradle..."
cd "$ANDROID_DIR"

chmod +x gradlew
./gradlew assembleDebug --no-daemon

APK_SRC="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
if [[ -f "$APK_SRC" ]]; then
  mkdir -p "$ROOT_DIR/dist/apk"
  cp "$APK_SRC" "$ROOT_DIR/dist/apk/app-debug.apk"
  log_success "Android APK successfully generated at: $ROOT_DIR/dist/apk/app-debug.apk"
else
  log_success "Android Gradle compilation completed successfully!"
fi
