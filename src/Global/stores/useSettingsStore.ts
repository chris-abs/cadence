import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type DateFormat = 'relative' | 'absolute'

interface SettingsState {
  theme: Theme
  isCompactView: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  dateFormat: DateFormat

  applyTheme: (newTheme: Theme) => void
  setCompactView: (isCompact: boolean) => void
  setEmailNotifications: (enabled: boolean) => void
  setPushNotifications: (enabled: boolean) => void
  setDateFormat: (format: DateFormat) => void
}

const applyThemeToDOM = (theme: Theme) => {
  const root = document.documentElement
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const effectiveTheme = theme === 'system' ? systemTheme : theme

  root.classList.remove('light', 'dark')
  root.classList.add(effectiveTheme)
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      isCompactView: false,
      emailNotifications: true,
      pushNotifications: true,
      dateFormat: 'relative',

      applyTheme: (newTheme) => {
        set({ theme: newTheme })
        applyThemeToDOM(newTheme)
      },

      setCompactView: (isCompact) => set({ isCompactView }),
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
      setDateFormat: (format) => set({ dateFormat: format }),
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        isCompactView: state.isCompactView,
        emailNotifications: state.emailNotifications,
        pushNotifications: state.pushNotifications,
        dateFormat: state.dateFormat,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme)
        }
      },
    },
  ),
)

const initializeThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = () => {
    const currentState = useSettingsStore.getState()
    if (currentState.theme === 'system') {
      applyThemeToDOM('system')
    }
  }

  mediaQuery.addEventListener('change', handleChange)
  return () => mediaQuery.removeEventListener('change', handleChange)
}

if (typeof window !== 'undefined') {
  initializeThemeListener()
}
