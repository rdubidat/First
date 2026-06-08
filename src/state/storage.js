// Tiny namespaced localStorage helper. Works identically in the browser
// preview and inside Electron's renderer (Chromium).
const PREFIX = 'gnt:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

export const isElectron =
  typeof window !== 'undefined' && !!window.gnt?.isElectron
