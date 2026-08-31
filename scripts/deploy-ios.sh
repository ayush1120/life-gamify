#!/usr/bin/env bash
# Life Gamify — Wireless iOS Deployment Script
# Automatically builds Web, syncs assets, builds signed iOS app, installs & launches on iPhone over Wi-Fi

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="/Users/ayushsharma/code/life-gamify-ios"

source "$SCRIPT_DIR/orchestrator.sh"

log_info "1/4. Building Web Production Assets..."
cd "$ROOT_DIR"
npm run build

log_info "2/4. Syncing assets to iOS project..."
rm -rf "$IOS_DIR/LifeGamify/Resources/dist"/*
mkdir -p "$IOS_DIR/LifeGamify/Resources/dist"
cp -r "$ROOT_DIR/dist/"* "$IOS_DIR/LifeGamify/Resources/dist/"

log_info "3/4. Compiling & Signing iOS App for iPhone..."
cd "$IOS_DIR"
DERIVED_DATA="/tmp/LifeGamifyDerivedData"

xcodebuild -project LifeGamify.xcodeproj \
  -scheme LifeGamify \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED_DATA" \
  -allowProvisioningUpdates \
  build -quiet

APP_PATH=$(find "$DERIVED_DATA/Build/Products" -name "LifeGamify.app" -type d | head -n 1)

if [[ -z "$APP_PATH" ]]; then
  log_error "Could not find built LifeGamify.app"
  exit 1
fi

log_info "4/4. Installing and launching on iPhone wirelessly..."
DEVICE_NAME="Ayush’s iPhone"

# Install app via CoreDevice
xcrun devicectl device install app --device "$DEVICE_NAME" "$APP_PATH"

# Launch app
xcrun devicectl device process launch --device "$DEVICE_NAME" com.lifegamify.app || {
  log_warn "App installed! Please tap 'Life Gamify' on your iPhone screen if not already open."
}

log_success "🎉 Life Gamify deployed and running on your iPhone!"
