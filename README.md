# DeskGPT - OpenAI Chat Client

<img src="https://github.com/0x11c11e/DeskGPT/blob/main/img/robot-icon.png" alt="DeskGPT Logo" width="256" height="256">


DeskGPT offers a seamless desktop experience for OpenAI's ChatGPT. Whether you're on Linux, Windows, or MacOS, DeskGPT is designed to provide direct and efficient access to ChatGPT without the need of a browser.

## Features

- **Direct Access**: Connect to OpenAI's ChatGPT directly from your desktop.
- **Optimized UI**: A user interface designed for readability and efficiency.
- **Cross-Platform**: Available for Linux (AppImage & .deb), Windows, and MacOS.

## Fork Improvements

- Updated default endpoint to chatgpt.com with an environment override for alternate domains.
- Added navigation allowlisting so external links open in the system browser instead of spawning extra windows.
- Enforced single-instance behavior by default to avoid duplicate renderer processes.
- Disabled the built-in spellchecker to reduce background CPU during typing.
- Injected reduced-motion styles to minimize animation overhead during streaming output.
- Removed the application menu and enabled auto-hide to reduce startup work.
- Fixed icon resolution in packaged builds by including image assets in the build.
- Updated Electron and build tooling and addressed dependency vulnerabilities.
- Added Linux-focused tuning support via `deskgpt-flags.conf` for Wayland and rendering flags.
- Added a Linux launcher script for native app menu integration.

## Installation

### For Linux

**From Source (Development)**:

1. Clone the repository:
`git clone https://github.com/locainin/DeskGPT.git`
2. Move into the repo:
`cd DeskGPT`
3. Install dependencies:
`npm install`
4. Run in development mode:
`npm start`
5. Install the local launcher and desktop entry:
`./scripts/install-local-launcher.sh`

**Arch Linux (local PKGBUILD)**:

1. Install using paru (local PKGBUILD):
`paru -U .`
2. Or build manually with makepkg:
`makepkg -si`

**Packaged (Local Build)**:

1. Build the binary:
`npm run pack`
2. Run the packaged binary from `dist/linux-unpacked/deskgpt`.

**AppImage**:

1. Download the latest AppImage from the [releases](https://github.com/0x11c11e/DeskGPT/releases) page.
2. Make the AppImage executable: `chmod +x DeskGPT.AppImage`
3. Run: `./DeskGPT.AppImage`

**.deb Package**:

1. Download the latest .deb package from the [releases](https://github.com/0x11c11e/DeskGPT/releases) page.
2. Install:
`sudo dpkg -i DeskGPT.deb
sudo apt-get install -f`

### For Windows

Download the `.exe` installer from the [releases](https://github.com/0x11c11e/DeskGPT/releases) page and follow the installation steps.

### For MacOS

Download the `.dmg` file from the [releases](https://github.com/0x11c11e/DeskGPT/releases) page and drag the application to your Applications folder.

## Contributing

We welcome contributions! If you find a bug or have a feature request, please open an issue. If you'd like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## Linux Integration

- Local launcher: `./scripts/install-local-launcher.sh` installs the menu entry and launcher.
- Optional flags config: add Chromium/Electron flags to `~/.config/deskgpt/deskgpt-flags.conf` (one per line).
- On Electron 38+ running in a Wayland session, Wayland is the default backend; add `--ozone-platform=x11` in the flags file only if Xwayland fallback is required.

## Acknowledgments

- OpenAI for providing the ChatGPT platform.
- Electron community for their robust framework.
- And all contributors who have helped in making DeskGPT better!
