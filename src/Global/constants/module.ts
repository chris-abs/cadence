import { PackageIcon, UtensilsIcon, ClipboardCheckIcon, CreditCardIcon } from 'lucide-react'
import { ModuleID } from '@/Global/types/family'

export const moduleDefinitions = {
  storage: {
    id: 'storage' as ModuleID,
    name: 'Storage',
    description: 'Organise containers, items, and manage storage spaces',
    icon: PackageIcon,
  },
  meals: {
    id: 'meals' as ModuleID,
    name: 'Meals',
    description: 'Plan meals, create shopping lists, and track ingredients',
    icon: UtensilsIcon,
  },
  chores: {
    id: 'chores' as ModuleID,
    name: 'Chores',
    description: 'Assign and track household chores and responsibilities',
    icon: ClipboardCheckIcon,
  },
  services: {
    id: 'services' as ModuleID,
    name: 'Services',
    description: 'Track subscriptions, bills, and recurring payments',
    icon: CreditCardIcon,
  },
}

export const modulesList = Object.values(moduleDefinitions)
