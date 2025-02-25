import {
  HomeIcon,
  PackageIcon,
  FolderOpenIcon,
  BoxIcon,
  TagsIcon,
  UtensilsIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  GalleryVerticalEndIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type ElementType } from 'react'
import { ModuleID } from '@/Global/types/family'

interface TeamConfig {
  name: string
  logo: ElementType
  plan: string
  disabled: boolean
}

interface NavigationItem {
  title: string
  url: string
  icon?: LucideIcon
  moduleId?: ModuleID
  items?: {
    title: string
    url: string
  }[]
}

interface NavigationConfig {
  teams: TeamConfig[]
  navMain: {
    dashboard: NavigationItem
    modules: Record<ModuleID, NavigationItem[]>
  }
}

export const navigationConfig: NavigationConfig = {
  teams: [
    {
      name: 'Cadence',
      logo: HomeIcon,
      plan: 'Family Platform',
      disabled: true,
    },
  ],
  navMain: {
    dashboard: {
      title: 'Dashboard',
      url: '/cadence',
      icon: HomeIcon,
    },
    modules: {
      storage: [
        {
          title: 'Collections',
          url: '/cadence/storage',
          icon: GalleryVerticalEndIcon,
        },
        {
          title: 'Workspaces',
          url: '/cadence/storage/workspaces',
          icon: BoxIcon,
        },
        {
          title: 'Containers',
          url: '/cadence/storage/containers',
          icon: FolderOpenIcon,
          items: [
            {
              title: 'List',
              url: '/cadence/storage/containers',
            },
            {
              title: 'Assign',
              url: '/cadence/storage/containers/assign',
            },
          ],
        },
        {
          title: 'Items',
          url: '/cadence/storage/items',
          icon: PackageIcon,
          items: [
            {
              title: 'List',
              url: '/cadence/storage/items',
            },
            {
              title: 'Assign',
              url: '/cadence/storage/items/assign',
            },
          ],
        },
        {
          title: 'Tags',
          url: '/cadence/storage/tags',
          icon: TagsIcon,
          items: [
            {
              title: 'List',
              url: '/cadence/storage/tags',
            },
            {
              title: 'Assign',
              url: '/cadence/storage/tags/assign',
            },
          ],
        },
      ],
      meals: [
        {
          title: 'Meal Planning',
          url: '/cadence/meals',
          icon: UtensilsIcon,
        },
      ],
      chores: [
        {
          title: 'Chore Dashboard',
          url: '/cadence/chores',
          icon: ClipboardCheckIcon,
        },
      ],
      services: [
        {
          title: 'Subscriptions',
          url: '/cadence/services',
          icon: CreditCardIcon,
        },
      ],
    },
  },
}
