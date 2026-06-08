import { useCallback, useEffect, useState } from 'react'
import { load, save } from '../state/storage'

// Light / dark theme with persistence. Defaults to the OS preference on first
// run, then remembers the user's explicit choice. Toggles the `dark` class on
// <html> so Tailwind's class-based dark mode kicks in.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = load('theme', null)
    if (saved === 'light' || saved === 'dark') return saved
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    save('theme', theme)
  }, [theme])

  const toggle = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  )

  return { theme, toggle, isDark: theme === 'dark' }
}
