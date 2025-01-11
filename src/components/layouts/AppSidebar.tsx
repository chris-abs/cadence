import * as React from 'react'
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Box,
  FolderOpen,
  Package,
  Tags,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/layouts/sidebar'
import { NavMain, NavUser, TeamSwitcher } from '@/components/layouts/nav'

const data = {
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
        title: 'Workspaces',
        url: '/workspaces',
        icon: Box,
      },
      {
        title: 'Containers',
        url: '/containers',
        icon: FolderOpen,
      },
      {
        title: 'Items',
        url: '/items',
        icon: Package,
      },
      {
        title: 'Tags',
        url: '/tags',
        icon: Tags,
      },
    ],
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain config={data.navMain.entities} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
