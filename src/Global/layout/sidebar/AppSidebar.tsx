import * as React from 'react'

import {
  SidebarCore,
  SidebarProfile,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarFamilyManager,
} from './sections'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarFamilyManager />
      </SidebarHeader>
      <SidebarContent>
        <SidebarCore />
      </SidebarContent>
      <SidebarFooter>
        <SidebarProfile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
