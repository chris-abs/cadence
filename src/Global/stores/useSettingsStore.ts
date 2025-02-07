import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type DateFormat = 'relative' | 'absolute'
export type CameraPermissionStatus = 'granted' | 'denied' | 'prompt' | 'not_supported'

interface SettingsState {
  theme: Theme
  isCompact: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  dateFormat: DateFormat
  sidebarCollapsed: boolean
  cameraPermission: CameraPermissionStatus

  applyTheme: (newTheme: Theme) => void
  setCompact: (isCompact: boolean) => void
  setEmailNotifications: (enabled: boolean) => void
  setPushNotifications: (enabled: boolean) => void
  setDateFormat: (format: DateFormat) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCameraPermission: (status: CameraPermissionStatus) => void
  checkCameraSupport: () => Promise<boolean>
  requestCameraPermission: () => Promise<boolean>
}

const applyThemeToDOM = (theme: Theme) => {
  const root = document.documentElement
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const effectiveTheme = theme === 'system' ? systemTheme : theme

  root.classList.remove('light', 'dark')
  root.classList.add(effectiveTheme)
}

const applyCompactView = (isCompact: boolean) => {
  const root = document.documentElement
  root.classList.toggle('compact-view', isCompact)
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      isCompact: false,
      emailNotifications: true,
      pushNotifications: true,
      dateFormat: 'relative',
      sidebarCollapsed: false,
      cameraPermission: 'prompt',

      applyTheme: (newTheme) => {
        set({ theme: newTheme })
        applyThemeToDOM(newTheme)
      },

      setCompact: (isCompact) => {
        set({ isCompact })
        applyCompactView(isCompact)
      },

      setEmailNotifications: (enabled) => set({ emailNotifications: enabled }),
      setPushNotifications: (enabled) => set({ pushNotifications: enabled }),
      setDateFormat: (format) => set({ dateFormat: format }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCameraPermission: (status) => set({ cameraPermission: status }),
      checkCameraSupport: async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
          set({ cameraPermission: 'not_supported' })
          return false
        }
        return true
      },

      requestCameraPermission: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          })
          stream.getTracks().forEach((track) => track.stop())
          set({ cameraPermission: 'granted' })
          return true
        } catch (error) {
          set({
            cameraPermission:
              error instanceof Error && error.name === 'NotAllowedError' ? 'denied' : 'prompt',
          })
          return false
        }
      },
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        isCompact: state.isCompact,
        emailNotifications: state.emailNotifications,
        pushNotifications: state.pushNotifications,
        dateFormat: state.dateFormat,
        sidebarCollapsed: state.sidebarCollapsed,
        cameraPermission: state.cameraPermission,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme)
          applyCompactView(state.isCompact)
        }
      },
    },
  ),
)
