import { type LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/Global/layout/sidebar/sections/SidebarFoundation'

export function SidebarCore({
  config,
}: {
  config: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {config.map((entry) => (
          <Link key={entry.title} to={entry.url}>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={entry.title}>
                {entry.icon && <entry.icon />}
                <span>{entry.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
