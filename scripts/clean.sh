#!/usr/bin/env bash
# Life Gamify — Clean Build Caches

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/orchestrator.sh"

log_info "Cleaning Life Gamify build caches..."

# 1. Clean Web Dist
cd "$ROOT_DIR"
if [[ -d "$ROOT_DIR/dist" ]]; then
  rm -rf "$ROOT_DIR/dist"
  log_success "Cleaned shared web dist/"
fi

# 2. Clean Android Caches
if [[ -d "$ANDROID_DIR" ]]; then
  cd "$ANDROID_DIR"
  if [[ -f "./gradlew" ]]; then
    ./gradlew clean --no-daemon >/dev/null 2>&1 || true
    log_success "Cleaned Android Gradle build caches"
  fi
  rm -rf "$ANDROID_DIR/app/src/main/assets/dist"
fi

# 3. Clean iOS Assets
if [[ -d "$IOS_DIR" ]]; then
  rm -rf "$IOS_DIR/LifeGamify/Resources/dist"
  log_success "Cleaned iOS synced assets"
fi

log_success "All build caches cleaned successfully!"
