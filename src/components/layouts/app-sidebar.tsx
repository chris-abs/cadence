import * as React from 'react'
import { AudioWaveform, Command, GalleryVerticalEnd, Settings2, Search } from 'lucide-react'

import { NavMain, NavUser, TeamSwitcher } from '@/components/layouts/nav'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/layouts/sidebar'

const data = {
  teams: [
    {
      name: 'Line',
      logo: GalleryVerticalEnd,
      plan: 'Specialised',
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
  navMain: [
    {
      title: 'Collections',
      url: '#',
      icon: Search,
      isActive: true,
      items: [
        {
          title: 'Workspaces',
          url: '#',
          type: 'workspace',
        },
        {
          title: 'Containers',
          url: '#',
          type: 'container',
        },
        {
          title: 'Items',
          url: '#',
          type: 'item',
        },
        {
          title: 'Tags',
          url: '#',
          type: 'tag',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Alerts',
          url: '#',
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
