#!/usr/bin/env bash
# Life Gamify — Unified Local Orchestration Helper

set -eo pipefail

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
RESET="\033[0m"

log_info() {
  echo -e "${BLUE}${BOLD}[INFO]${RESET} $1"
}

log_success() {
  echo -e "${GREEN}${BOLD}[SUCCESS]${RESET} $1"
}

log_warn() {
  echo -e "${YELLOW}${BOLD}[WARN]${RESET} $1"
}

log_error() {
  echo -e "${RED}${BOLD}[ERROR]${RESET} $1"
}

# Resolve Workspace Root and Sibling Native Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$(cd "$ROOT_DIR/../life-gamify-ios" 2>/dev/null && pwd || echo "$ROOT_DIR/../life-gamify-ios")"
ANDROID_DIR="$(cd "$ROOT_DIR/../life-gamify-android" 2>/dev/null && pwd || echo "$ROOT_DIR/../life-gamify-android")"

export ROOT_DIR
export IOS_DIR
export ANDROID_DIR

# Set Default Environment Variables
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home 2>/dev/null || echo "")}"
if [[ -d "$ANDROID_HOME/platform-tools" ]]; then
  export PATH="$ANDROID_HOME/platform-tools:$PATH"
fi

verify_workspace() {
  log_info "Verifying Life Gamify multi-repo workspace..."
  
  if [[ ! -d "$ROOT_DIR" ]]; then
    log_error "Shared repo directory not found at $ROOT_DIR"
    exit 1
  fi

  if [[ ! -d "$IOS_DIR" ]]; then
    log_warn "iOS repo directory not found at $IOS_DIR"
  else
    log_success "iOS native layer resolved: $IOS_DIR"
  fi

  if [[ ! -d "$ANDROID_DIR" ]]; then
    log_warn "Android repo directory not found at $ANDROID_DIR"
  else
    log_success "Android native layer resolved: $ANDROID_DIR"
  fi
}
