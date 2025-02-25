import { create } from 'zustand'

import { Family, Module } from '@/Family/types'

interface FamilyState {
  currentFamily: Family | null
  setCurrentFamily: (family: Family | null) => void
  updateModuleStatus: (moduleId: string, isEnabled: boolean) => void
  isModuleEnabled: (moduleId: string) => boolean
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  currentFamily: null,

  setCurrentFamily: (family) => set({ currentFamily: family }),

  updateModuleStatus: (moduleId, isEnabled) => {
    const { currentFamily } = get()
    if (!currentFamily) return

    const updatedModules: Module[] = currentFamily.modules.map((module: Module) =>
      module.id === moduleId ? { ...module, isEnabled } : module,
    )

    set({
      currentFamily: {
        ...currentFamily,
        modules: updatedModules,
      },
    })
  },

  isModuleEnabled: (moduleId) => {
    const { currentFamily } = get()
    if (!currentFamily) return false
    return currentFamily.modules.find((m) => m.id === moduleId)?.isEnabled || false
  },
}))
