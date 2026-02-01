pkgname=deskgpt
pkgver=aca3577
pkgrel=1
pkgdesc="Desktop client for OpenAI ChatGPT"
arch=('x86_64')
url="https://github.com/locainin/DeskGPT"
license=('GPL3')
# Depends on runtime system libraries used by the bundled Electron build.
depends=('gtk3' 'nss' 'libxss' 'libxcomposite' 'libxdamage' 'libxrandr' 'libxkbcommon' 'libdrm' 'mesa' 'libx11' 'libxcb' 'libxfixes' 'libxi' 'libxext' 'libxrender' 'alsa-lib')
# Uses Node.js to build the bundled Linux output.
makedepends=('git' 'nodejs')
# Builds from the working tree to avoid makepkg cloning into the repository.
source=()
sha256sums=()

pkgver() {
  cd "${startdir}"
  git describe --long --tags --always | sed 's/^v//;s/-/./g'
}

build() {
  cd "${startdir}"

  # Ensures dependencies are installed from the lockfile for consistent builds.
  npm ci --prefer-offline --no-audit --progress=false
  # Generates the unpacked Linux build used for packaging.
  npm run pack
}

package() {
  local build_dir="${startdir}/dist/linux-unpacked"
  if [[ ! -d "$build_dir" ]]; then
    printf '%s\n' "Expected build output not found: $build_dir" >&2
    return 1
  fi

  install -d "${pkgdir}/usr/lib/deskgpt"
  cp -a "${build_dir}/." "${pkgdir}/usr/lib/deskgpt/"

  install -d "${pkgdir}/usr/bin"
  cat > "${pkgdir}/usr/bin/deskgpt" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

DESKGPT_BIN="/usr/lib/deskgpt/deskgpt"

mesa_vendor_file="/usr/share/glvnd/egl_vendor.d/50_mesa.json"
mesa_vendor_id_regex='^(0x8086|0x1002)$'
mesa_icd_primary="/usr/share/vulkan/icd.d/intel_icd.x86_64.json"
mesa_icd_secondary="/usr/share/vulkan/icd.d/intel_hasvk_icd.x86_64.json"
mesa_icd_fallback="/usr/share/vulkan/icd.d/*radeon*icd*.x86_64.json"

find_mesa_card() {
  local vendor_path vendor_id card
  for vendor_path in /sys/class/drm/card*/device/vendor; do
    [[ -r "$vendor_path" ]] || continue
    vendor_id="$(<"$vendor_path")"
    if [[ "$vendor_id" =~ $mesa_vendor_id_regex ]]; then
      card="$(basename "$(dirname "$vendor_path")")"
      printf '%s\n' "$card"
      return 0
    fi
  done
  return 1
}

run_with_mesa() {
  local card
  local icd_path=""
  local icd_candidates
  if [[ -r "$mesa_vendor_file" ]] && card="$(find_mesa_card)"; then
    export __EGL_VENDOR_LIBRARY_FILENAMES="$mesa_vendor_file"
    export __GLX_VENDOR_LIBRARY_NAME=mesa
    if [[ -e "/dev/dri/$card" ]]; then
      export WLR_DRM_DEVICES="/dev/dri/$card"
      export AQ_DRM_DEVICES="/dev/dri/$card"
    fi
  fi
  if [[ -r "$mesa_icd_primary" ]]; then
    icd_path="$mesa_icd_primary"
  elif [[ -r "$mesa_icd_secondary" ]]; then
    icd_path="$mesa_icd_secondary"
  else
    mapfile -t icd_candidates < <(compgen -G "$mesa_icd_fallback")
    if [[ ${#icd_candidates[@]} -gt 0 ]]; then
      icd_path="${icd_candidates[0]}"
    fi
  fi
  if [[ -n "$icd_path" ]]; then
    export VK_ICD_FILENAMES="$icd_path"
  fi
  export VK_LOADER_LAYERS_DISABLE="VK_LAYER_NV_optimus,VK_LAYER_NV_present,VK_LAYER_MESA_device_select,VK_LAYER_MESA_anti_lag"
  export NODEVICE_SELECT=1
  export ELECTRON_OZONE_PLATFORM_HINT=x11
  export DESKGPT_SUPPRESS_GPU_DIALOG=1
  "$DESKGPT_BIN" --ozone-platform=x11 "$@"
}

run_with_mesa_x11() {
  local card
  local icd_path=""
  local icd_candidates
  if [[ -r "$mesa_vendor_file" ]] && card="$(find_mesa_card)"; then
    export __EGL_VENDOR_LIBRARY_FILENAMES="$mesa_vendor_file"
    export __GLX_VENDOR_LIBRARY_NAME=mesa
    if [[ -e "/dev/dri/$card" ]]; then
      export WLR_DRM_DEVICES="/dev/dri/$card"
      export AQ_DRM_DEVICES="/dev/dri/$card"
    fi
  fi
  if [[ -r "$mesa_icd_primary" ]]; then
    icd_path="$mesa_icd_primary"
  elif [[ -r "$mesa_icd_secondary" ]]; then
    icd_path="$mesa_icd_secondary"
  else
    mapfile -t icd_candidates < <(compgen -G "$mesa_icd_fallback")
    if [[ ${#icd_candidates[@]} -gt 0 ]]; then
      icd_path="${icd_candidates[0]}"
    fi
  fi
  if [[ -n "$icd_path" ]]; then
    export VK_ICD_FILENAMES="$icd_path"
  fi
  export VK_LOADER_LAYERS_DISABLE="VK_LAYER_NV_optimus,VK_LAYER_NV_present,VK_LAYER_MESA_device_select,VK_LAYER_MESA_anti_lag"
  export NODEVICE_SELECT=1
  export ELECTRON_OZONE_PLATFORM_HINT=x11
  export DESKGPT_SUPPRESS_GPU_DIALOG=1
  export DESKGPT_SKIP_FLAGS=1
  "$DESKGPT_BIN" --ozone-platform=x11 --disable-features=Vulkan "$@"
}

run_with_prime() {
  if ! command -v prime-run >/dev/null 2>&1; then
    printf '%s\n' "prime-run not available; cannot retry with NVIDIA." >&2
    return 1
  fi
  exec prime-run "$DESKGPT_BIN" "$@"
}

start_epoch="$(date +%s)"
if run_with_mesa "$@"; then
  exit 0
fi

status="$?"
elapsed="$(( $(date +%s) - start_epoch ))"
if [[ "$status" -eq 1 && "$elapsed" -lt 5 ]]; then
  if run_with_mesa_x11 "$@"; then
    exit 0
  fi
  run_with_prime "$@"
  exit $?
fi

exit "$status"
EOF
  chmod 755 "${pkgdir}/usr/bin/deskgpt"

  install -d "${pkgdir}/usr/share/applications"
  install -m 644 "${startdir}/packaging/deskgpt.desktop" "${pkgdir}/usr/share/applications/deskgpt.desktop"

  install -d "${pkgdir}/usr/share/icons/hicolor/256x256/apps"
  install -m 644 "${startdir}/img/robot-icon.png" "${pkgdir}/usr/share/icons/hicolor/256x256/apps/deskgpt.png"

  install -d "${pkgdir}/etc/xdg/deskgpt"
  install -m 644 "${startdir}/packaging/deskgpt-flags.conf" "${pkgdir}/etc/xdg/deskgpt/deskgpt-flags.conf"
}
