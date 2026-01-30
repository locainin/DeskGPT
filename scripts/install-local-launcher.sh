#!/usr/bin/env bash
set -euo pipefail

# Installs a local launcher and desktop entry for the local build.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
launcher_src="${repo_root}/packaging/deskgpt"
desktop_src="${repo_root}/packaging/deskgpt.desktop"
local_desktop="$HOME/.local/share/applications/deskgpt.desktop"

mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications"
# Prevents accidental overrides of the system AUR binary. Set
# DESKGPT_ENABLE_LOCAL_LAUNCHER=1 to allow local launcher installation.
if [[ "${DESKGPT_ENABLE_LOCAL_LAUNCHER:-}" != "1" ]]; then
  echo "Local launcher install disabled (DESKGPT_ENABLE_LOCAL_LAUNCHER=1 to enable)." >&2
  exit 1
fi
ln -sf "$launcher_src" "$HOME/.local/bin/deskgpt"
# Avoids clobbering a customized desktop entry unless explicitly forced.
# Preserves local performance tweaks when installing the dev launcher.
if [[ -f "$local_desktop" ]] && ! cmp -s "$local_desktop" "$desktop_src" && [[ "${DESKGPT_FORCE_LAUNCHER:-}" != "1" ]]; then
  echo "Refusing to overwrite customized desktop entry: ${local_desktop}" >&2
  echo "Set DESKGPT_FORCE_LAUNCHER=1 to override this guard." >&2
  exit 1
fi
install -m 644 "$desktop_src" "$local_desktop"
update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
