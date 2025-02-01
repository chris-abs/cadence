import * as React from 'react'

import {
  SidebarCore,
  SidebarUser,
  TeamSwitcher,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  navigationConfig,
} from './sections'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={navigationConfig.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarCore config={navigationConfig.navMain.entities} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
