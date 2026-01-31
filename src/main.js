const { app, BrowserWindow, Menu, shell } = require('electron')
const fs = require('fs')
const path = require('path')

// Determine the platform
const isWindows = process.platform === 'win32'
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

// Default entry point with environment override for alternate domains or testing.
const chatGptUrl = process.env.DESKGPT_URL || 'https://chatgpt.com/'
// Allowlist for in-app navigation to avoid loading unrelated sites in the renderer.
const allowedHostSuffixes = ['chatgpt.com', 'openai.com']
// Optional overrides for multi-instance and popup behavior.
const allowMultipleInstances = process.env.DESKGPT_ALLOW_MULTIPLE_INSTANCES === '1'
const allowMultipleWindows = process.env.DESKGPT_ALLOW_MULTIPLE_WINDOWS === '1'
const disableStyleOptimizations =
  process.env.DESKGPT_DISABLE_STYLE_OPTIMIZATIONS === '1'
const userConfigRoot =
  process.env.XDG_CONFIG_HOME ||
  (process.env.HOME ? path.join(process.env.HOME, '.config') : null)
const flagsConfigCandidates = []
if (userConfigRoot) {
  flagsConfigCandidates.push(
    path.join(userConfigRoot, 'deskgpt', 'deskgpt-flags.conf')
  )
}
// Falls back to the system-wide config when per-user config is unavailable.
flagsConfigCandidates.push('/etc/xdg/deskgpt/deskgpt-flags.conf')

const reducedMotionCss = `
*,
*::before,
*::after {
  animation-duration: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  scroll-behavior: auto !important;
}
`

/**
 * Gets the appropriate icon path based on the platform.
 *
 * @returns {string} Path to the icon.
 */
function getIconPath() {
  if (isWindows) {
    return path.join(app.getAppPath(), 'img', 'robot-icon.ico')
  } else if (isMac) {
    return path.join(app.getAppPath(), 'img', 'robot-icon.icns')
  } else if (isLinux) {
    return path.join(app.getAppPath(), 'img', 'robot-icon.png')
  } else {
    console.warn('Unrecognized platform. Using PNG icon as default.')
    return path.join(app.getAppPath(), 'img', 'robot-icon.png')
  }
}

let mainWindow

/**
 * Determines whether a hostname is allowed to stay inside the app window.
 *
 * @param {string} hostname Hostname extracted from a URL.
 * @returns {boolean} True when the hostname is allowlisted.
 */
function isAllowedHostname(hostname) {
  return allowedHostSuffixes.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  )
}

/**
 * Validates that a URL is HTTPS and targets an allowlisted hostname.
 *
 * @param {string} urlString URL to validate.
 * @returns {boolean} True when navigation should remain in-app.
 */
function isAllowedUrl(urlString) {
  try {
    const { hostname, protocol } = new URL(urlString)
    return protocol === 'https:' && isAllowedHostname(hostname)
  } catch (error) {
    return false
  }
}

/**
 * Checks whether a URL is HTTP or HTTPS for safe external handling.
 *
 * @param {string} urlString URL to validate.
 * @returns {boolean} True when the URL uses http or https.
 */
function isHttpUrl(urlString) {
  try {
    const { protocol } = new URL(urlString)
    return protocol === 'https:' || protocol === 'http:'
  } catch (error) {
    return false
  }
}

/**
 * Brings the main window to the foreground when a second instance is invoked.
 */
function focusMainWindow() {
  if (!mainWindow) {
    return
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.focus()
}

function applyCommandLineFlags() {
  const flagsConfigPath = flagsConfigCandidates.find((candidate) =>
    fs.existsSync(candidate)
  )
  if (!flagsConfigPath) {
    return
  }

  const rawFlags = fs.readFileSync(flagsConfigPath, 'utf8')
  rawFlags
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .forEach((line) => {
      if (!line.startsWith('--')) {
        console.warn(`Ignoring invalid flag entry: ${line}`)
        return
      }
      const trimmed = line.replace(/^--+/, '')
      const [flagName, ...rest] = trimmed.split(/\s+/)
      const joined = rest.join(' ')
      if (flagName.includes('=')) {
        const [name, value] = flagName.split(/=(.*)/)
        app.commandLine.appendSwitch(name, value ?? '')
      } else if (joined.length > 0) {
        app.commandLine.appendSwitch(flagName, joined)
      } else {
        app.commandLine.appendSwitch(flagName)
      }
    })
}

/**
 * Creates the main application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'DeskGPT',
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // Enhanced security
      enableRemoteModule: false, // Disable remote module for increased security
      spellcheck: false, // Disable spellchecker to reduce background CPU while typing.
    },
    icon: getIconPath(),
  })

  // Prevent external links from spawning extra windows or replacing the main app view.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (!details.url) {
      return { action: 'deny' }
    }
    if (isAllowedUrl(details.url)) {
      if (allowMultipleWindows) {
        return { action: 'allow' }
      }
      mainWindow
        .loadURL(details.url)
        .catch((error) => console.error('Failed to load URL:', error))
      return { action: 'deny' }
    }

    if (isHttpUrl(details.url)) {
      shell
        .openExternal(details.url)
        .catch((error) => console.error('Failed to open external URL:', error))
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, details) => {
    const targetUrl =
      typeof details === 'string' ? details : details?.url || details?.targetURL
    if (!targetUrl || isAllowedUrl(targetUrl)) {
      return
    }
    event.preventDefault()
    if (isHttpUrl(targetUrl)) {
      shell
        .openExternal(targetUrl)
        .catch((error) => console.error('Failed to open external URL:', error))
    }
  })

  // Keeps reload shortcuts working even when the web app registers unload handlers.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && !input.alt && input.key) {
      const key = input.key.toLowerCase()
      if (key === 'r') {
        event.preventDefault()
        if (input.shift) {
          mainWindow.webContents.reloadIgnoringCache()
        } else {
          mainWindow.webContents.reload()
        }
      }
    }
  })

  if (!disableStyleOptimizations) {
    mainWindow.webContents.on('dom-ready', () => {
      mainWindow.webContents
        .insertCSS(reducedMotionCss)
        .catch((error) =>
          console.error('Failed to apply style optimizations:', error)
        )
    })
  }

  mainWindow.loadURL(chatGptUrl).catch((err) => {
    console.error('Failed to load URL:', err)
  })

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

applyCommandLineFlags()

if (!allowMultipleInstances) {
  // Single-instance lock reduces duplicate renderer processes from repeated launches.
  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    app.quit()
  } else {
    app.on('second-instance', () => {
      focusMainWindow()
    })
  }
}

app.whenReady().then(() => {
  // Remove the default application menu to reduce startup work and UI overhead.
  Menu.setApplicationMenu(null)
  createWindow()
})

app.on('window-all-closed', () => {
  // Quit the application when all windows are closed, except on macOS.
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS, recreate the window when the dock icon is clicked and no other windows are open.
  if (mainWindow === null) {
    createWindow()
  }
})
