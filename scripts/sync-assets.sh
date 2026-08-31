#!/usr/bin/env bash
# Life Gamify — Incremental Web Assets Sync to Native Layers

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/orchestrator.sh"

log_info "Synchronizing web application assets to native shells..."

cd "$ROOT_DIR"

# Build web distribution bundle if missing or on demand
if [[ ! -d "$ROOT_DIR/dist" || "$1" == "--force" ]]; then
  log_info "Building production web bundle via Vite..."
  npm run build
fi

# 1. Sync to iOS Resources/dist
if [[ -d "$IOS_DIR" ]]; then
  IOS_ASSETS_DIR="$IOS_DIR/LifeGamify/Resources/dist"
  mkdir -p "$IOS_ASSETS_DIR"
  rsync -av --delete "$ROOT_DIR/dist/" "$IOS_ASSETS_DIR/" >/dev/null 2>&1 || cp -R "$ROOT_DIR/dist/"* "$IOS_ASSETS_DIR/"
  log_success "Synced web assets to iOS: $IOS_ASSETS_DIR"
fi

# 2. Sync to Android app/src/main/assets/dist
if [[ -d "$ANDROID_DIR" ]]; then
  ANDROID_ASSETS_DIR="$ANDROID_DIR/app/src/main/assets/dist"
  mkdir -p "$ANDROID_ASSETS_DIR"
  rsync -av --delete "$ROOT_DIR/dist/" "$ANDROID_ASSETS_DIR/" >/dev/null 2>&1 || cp -R "$ROOT_DIR/dist/"* "$ANDROID_ASSETS_DIR/"
  log_success "Synced web assets to Android: $ANDROID_ASSETS_DIR"
fi
