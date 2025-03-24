import { PackageIcon, UtensilsIcon, ClipboardCheckIcon, CreditCardIcon } from 'lucide-react'
import { ModuleID } from '@/Family/types'

export const moduleDefinitions = {
  storage: {
    id: 'storage' as ModuleID,
    name: 'Storage',
    description: 'Organise containers, items, and manage storage spaces',
    icon: PackageIcon,
    isAvailable: true,
  },
  meals: {
    id: 'meals' as ModuleID,
    name: 'Meals',
    description: 'Plan meals, create shopping lists, and track ingredients',
    icon: UtensilsIcon,
    isAvailable: true,
  },
  chores: {
    id: 'chores' as ModuleID,
    name: 'Chores',
    description: 'Assign and track household chores and responsibilities',
    icon: ClipboardCheckIcon,
    isAvailable: true,
  },
  services: {
    id: 'services' as ModuleID,
    name: 'Services',
    description: 'Track subscriptions, bills, and recurring payments',
    icon: CreditCardIcon,
    isAvailable: false,
  },
}

export const modulesList = Object.values(moduleDefinitions)
