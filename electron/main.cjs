const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
  shell,
} = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'
const DEV_URL = 'http://localhost:5173'

// ---- lightweight settings store (no external deps) -------------------------
const storePath = path.join(app.getPath('userData'), 'gnt-settings.json')
function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf-8'))
  } catch {
    return {}
  }
}
function saveSettings(patch) {
  const merged = { ...loadSettings(), ...patch }
  try {
    fs.writeFileSync(storePath, JSON.stringify(merged, null, 2))
  } catch {
    /* best-effort */
  }
  return merged
}

const DEFAULT_SIZE = { width: 380, height: 600 }
const COMPACT_SIZE = { width: 168, height: 168 }

let win = null
let tray = null
let compact = false
let expandedBounds = null // remembers full-size bounds while compact

function createWindow() {
  const saved = loadSettings()
  const alwaysOnTop = saved.alwaysOnTop !== false // default true

  win = new BrowserWindow({
    width: saved.bounds?.width || DEFAULT_SIZE.width,
    height: saved.bounds?.height || DEFAULT_SIZE.height,
    x: saved.bounds?.x,
    y: saved.bounds?.y,
    minWidth: 150,
    minHeight: 150,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop,
    skipTaskbar: false,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (alwaysOnTop) win.setAlwaysOnTop(true, 'floating')

  if (isDev) {
    win.loadURL(DEV_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Open external links in the user's browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const persistBounds = () => {
    if (win && !compact && !win.isMinimized()) {
      saveSettings({ bounds: win.getBounds() })
    }
  }
  win.on('moved', persistBounds)
  win.on('resized', persistBounds)

  win.on('closed', () => {
    win = null
  })
}

// ---- tray ------------------------------------------------------------------
function createTray() {
  try {
    const trayIcon = nativeImage.createFromPath(
      path.join(__dirname, '..', 'build', 'tray.png')
    )
    tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon)
    tray.setToolTip('Growth Network Tasks')
    rebuildTrayMenu()
    tray.on('click', () => toggleWindow())
  } catch {
    /* tray is a nice-to-have; ignore failures */
  }
}

function rebuildTrayMenu() {
  if (!tray) return
  const onTop = win ? win.isAlwaysOnTop() : true
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Leon', click: () => showWindow() },
      { label: 'Hide', click: () => win && win.hide() },
      { type: 'separator' },
      {
        label: 'Pin on top',
        type: 'checkbox',
        checked: onTop,
        click: () => setAlwaysOnTop(!onTop),
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  )
}

function showWindow() {
  if (!win) createWindow()
  win.show()
  win.focus()
}
function toggleWindow() {
  if (!win) return createWindow()
  if (win.isVisible() && !win.isMinimized()) win.hide()
  else showWindow()
}
function setAlwaysOnTop(value) {
  if (!win) return
  win.setAlwaysOnTop(value, 'floating')
  saveSettings({ alwaysOnTop: value })
  rebuildTrayMenu()
}

// ---- IPC -------------------------------------------------------------------
ipcMain.handle('win:minimize', () => win && win.minimize())
ipcMain.handle('win:hide', () => win && win.hide())
ipcMain.handle('win:quit', () => app.quit())

ipcMain.handle('win:toggle-always-on-top', () => {
  if (!win) return true
  const next = !win.isAlwaysOnTop()
  setAlwaysOnTop(next)
  return next
})
ipcMain.handle('win:get-always-on-top', () =>
  win ? win.isAlwaysOnTop() : true
)

ipcMain.handle('win:toggle-compact', () => {
  if (!win) return false
  compact = !compact
  if (compact) {
    expandedBounds = win.getBounds()
    const display = screen.getDisplayMatching(expandedBounds)
    win.setResizable(false)
    // dock the bubble to the top-right corner of the current display
    win.setBounds(
      {
        width: COMPACT_SIZE.width,
        height: COMPACT_SIZE.height,
        x: display.workArea.x + display.workArea.width - COMPACT_SIZE.width - 24,
        y: display.workArea.y + 24,
      },
      true
    )
  } else {
    win.setResizable(true)
    if (expandedBounds) win.setBounds(expandedBounds, true)
  }
  return compact
})

ipcMain.handle('settings:get', () => loadSettings())
ipcMain.handle('settings:set', (_e, patch) => saveSettings(patch))

// ---- app lifecycle ---------------------------------------------------------
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => showWindow())

  app.whenReady().then(() => {
    createWindow()
    createTray()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else showWindow()
    })
  })

  // Floating utility app: keep it alive in the tray on Windows/Linux.
  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') return
    // stay running in tray; quit only via tray/app menu
  })
}
