pkgname=deskgpt
pkgver=36d2953
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
exec /usr/lib/deskgpt/deskgpt "$@"
EOF
  chmod 755 "${pkgdir}/usr/bin/deskgpt"

  install -d "${pkgdir}/usr/share/applications"
  install -m 644 "${startdir}/packaging/deskgpt.desktop" "${pkgdir}/usr/share/applications/deskgpt.desktop"

  install -d "${pkgdir}/usr/share/icons/hicolor/256x256/apps"
  install -m 644 "${startdir}/img/robot-icon.png" "${pkgdir}/usr/share/icons/hicolor/256x256/apps/deskgpt.png"

  install -d "${pkgdir}/etc/xdg/deskgpt"
  install -m 644 "${startdir}/packaging/deskgpt-flags.conf" "${pkgdir}/etc/xdg/deskgpt/deskgpt-flags.conf"
}
