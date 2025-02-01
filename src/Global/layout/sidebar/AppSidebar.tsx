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
  SidebarCore,
  SidebarUser,
  TeamSwitcher,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from './sections'

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarCore config={data.navMain.entities} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
