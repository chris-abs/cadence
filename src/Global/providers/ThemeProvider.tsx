import { useSettingsStore } from '../stores/useSettingsStore'

export function ThemeProvider() {
  const { theme } = useSettingsStore()

  if (typeof window !== 'undefined') {
    const root = document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const effectiveTheme = theme === 'system' ? systemTheme : theme

    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)
  }

  return null
}
