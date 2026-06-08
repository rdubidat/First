const { contextBridge, ipcRenderer } = require('electron')

// Safe, minimal bridge between the React UI and the Electron main process.
contextBridge.exposeInMainWorld('gnt', {
  isElectron: true,
  minimize: () => ipcRenderer.invoke('win:minimize'),
  hide: () => ipcRenderer.invoke('win:hide'),
  quit: () => ipcRenderer.invoke('win:quit'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('win:toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('win:get-always-on-top'),
  toggleCompact: () => ipcRenderer.invoke('win:toggle-compact'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
})
