import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Box,
  FolderOpen,
  Package,
  Tags,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type ElementType } from 'react'

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
  items?: {
    title: string
    url: string
  }[]
}

interface NavigationConfig {
  teams: TeamConfig[]
  navMain: {
    entities: NavigationItem[]
  }
}

export const navigationConfig: NavigationConfig = {
  teams: [
    {
      name: 'Storage',
      logo: GalleryVerticalEnd,
      plan: 'Collections',
      disabled: true,
    },
    {
      name: 'Core',
      logo: AudioWaveform,
      plan: 'Startup',
      disabled: true,
    },
    {
      name: 'Corporate',
      logo: Command,
      plan: 'Free',
      disabled: true,
    },
  ],
  navMain: {
    entities: [
      {
        title: 'Dashboard',
        url: '/',
        icon: GalleryVerticalEnd,
      },
      {
        title: 'Workspaces',
        url: '/workspaces',
        icon: Box,
      },
      {
        title: 'Containers',
        url: '/containers',
        icon: FolderOpen,
        items: [
          {
            title: 'List',
            url: '/containers',
          },
          {
            title: 'Assign',
            url: '/containers/assign',
          },
        ],
      },
      {
        title: 'Items',
        url: '/items',
        icon: Package,
        items: [
          {
            title: 'List',
            url: '/items',
          },
          {
            title: 'Assign',
            url: '/items/assign',
          },
        ],
      },
      {
        title: 'Tags',
        url: '/tags',
        icon: Tags,
        items: [
          {
            title: 'List',
            url: '/tags',
          },
          {
            title: 'Assign',
            url: '/tags/assign',
          },
        ],
      },
    ],
  },
}
