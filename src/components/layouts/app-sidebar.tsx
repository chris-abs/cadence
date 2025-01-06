import * as React from 'react'
import { AudioWaveform, Command, GalleryVerticalEnd, Settings2, Search } from 'lucide-react'

import { NavMain } from '@/components/layouts/nav/nav-main'
import { NavUser } from '@/components/layouts/nav/nav-user'
import { TeamSwitcher } from '@/components/layouts/nav/team-switcher'
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
      name: 'Storage',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
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
        },
        {
          title: 'Containers',
          url: '#',
        },
        {
          title: 'Items',
          url: '#',
        },
        {
          title: 'Tags',
          url: '#',
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
