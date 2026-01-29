pkgname=deskgpt
pkgver=0.0.0
pkgrel=1
pkgdesc="Desktop client for OpenAI ChatGPT"
arch=('x86_64')
url="https://github.com/locainin/DeskGPT"
license=('GPL3')
depends=('electron>=40' 'gtk3' 'nss' 'libxss' 'libxcomposite' 'libxdamage' 'libxrandr' 'libxkbcommon' 'libdrm' 'mesa' 'libx11' 'libxcb' 'libxfixes' 'libxi' 'libxext' 'libxrender')
makedepends=('git')
source=("deskgpt::git+file://${startdir}")
sha256sums=('SKIP')

pkgver() {
  cd "${srcdir}/deskgpt"
  git describe --long --tags --always | sed 's/^v//;s/-/./g'
}

package() {
  install -d "${pkgdir}/usr/lib/deskgpt"
  cp -r "${srcdir}/deskgpt/src" "${pkgdir}/usr/lib/deskgpt/"
  cp -r "${srcdir}/deskgpt/img" "${pkgdir}/usr/lib/deskgpt/"
  install -m 644 "${srcdir}/deskgpt/package.json" "${pkgdir}/usr/lib/deskgpt/"

  install -d "${pkgdir}/usr/bin"
  cat > "${pkgdir}/usr/bin/deskgpt" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec electron /usr/lib/deskgpt "$@"
EOF
  chmod 755 "${pkgdir}/usr/bin/deskgpt"

  install -d "${pkgdir}/usr/share/applications"
  install -m 644 "${srcdir}/deskgpt/packaging/deskgpt.desktop" "${pkgdir}/usr/share/applications/deskgpt.desktop"

  install -d "${pkgdir}/usr/share/icons/hicolor/256x256/apps"
  install -m 644 "${srcdir}/deskgpt/img/robot-icon.png" "${pkgdir}/usr/share/icons/hicolor/256x256/apps/deskgpt.png"
}
