#!/usr/bin/env bash
set -euo pipefail

# Installs a local launcher and desktop entry for the local build.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
launcher_src="${repo_root}/packaging/deskgpt"
desktop_src="${repo_root}/packaging/deskgpt.desktop"

mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications"
ln -sf "$launcher_src" "$HOME/.local/bin/deskgpt"
install -m 644 "$desktop_src" "$HOME/.local/share/applications/deskgpt.desktop"
update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
