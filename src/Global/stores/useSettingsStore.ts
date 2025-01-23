// src/stores/useSettingsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type DateFormat = 'relative' | 'absolute'

interface SettingsState {
  // Display Preferences
  theme: Theme
  isCompactView: boolean

  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean

  // Date & Time Settings
  dateFormat: DateFormat

  // Theme Management
  applyTheme: (newTheme: Theme) => void
  setCompactView: (isCompact: boolean) => void

  // Notification Management
  setEmailNotifications: (enabled: boolean) => void
  setPushNotifications: (enabled: boolean) => void

  // Date & Time Management
  setDateFormat: (format: DateFormat) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial State Values
      theme: 'system',
      isCompactView: false,
      emailNotifications: true,
      pushNotifications: true,
      dateFormat: 'relative',

      // Theme Management
      applyTheme: (newTheme) => {
        set({ theme: newTheme })

        const applyThemeClass = (isDark: boolean) => {
          document.documentElement.classList.toggle('dark', isDark)
        }

        if (newTheme === 'system') {
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          applyThemeClass(systemPrefersDark)
        } else {
          applyThemeClass(newTheme === 'dark')
        }
      },

      // View Management
      setCompactView: (isCompact) => set({ isCompactView }),

      // Notification Management
      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),

      // Date Format Management
      setDateFormat: (format) => set({ dateFormat: format }),
    }),
    {
      name: 'user-settings',
      onRestore: (persistedState) => {
        const theme = persistedState.theme as Theme
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

        if (theme === 'system') {
          document.documentElement.classList.toggle('dark', systemPrefersDark)
        } else {
          document.documentElement.classList.toggle('dark', theme === 'dark')
        }

        return persistedState
      },
    },
  ),
)

// System Theme Change Listener
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  mediaQuery.addEventListener('change', (event) => {
    const store = useSettingsStore.getState()
    if (store.theme === 'system') {
      document.documentElement.classList.toggle('dark', event.matches)
    }
  })
}
