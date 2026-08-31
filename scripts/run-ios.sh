#!/usr/bin/env bash
# Life Gamify — Run iOS App with Live Dev Server

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/orchestrator.sh"

verify_workspace

log_info "Preparing iOS environment..."
"$SCRIPT_DIR/sync-assets.sh"

if command -v open >/dev/null 2>&1; then
  log_info "Opening LifeGamify.xcodeproj in Xcode..."
  open "$IOS_DIR/LifeGamify.xcodeproj"
fi

log_success "Starting Vite local development server for live-reloading..."
cd "$ROOT_DIR"
npm run dev
