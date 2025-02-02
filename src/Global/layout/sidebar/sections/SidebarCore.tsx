import { type LucideIcon, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Global/components/atoms'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/Global/layout/sidebar/sections/SidebarFoundation'
import { SidebarPopover } from './SidebarPopover'

export function SidebarCore({
  config,
}: {
  config: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {config.map((entry) => {
          if (entry.items && isCollapsed) {
            return (
              <SidebarPopover
                key={entry.title}
                title={entry.title}
                icon={entry.icon}
                items={entry.items}
              />
            )
          }

          if (entry.items) {
            return (
              <Collapsible
                key={entry.title}
                asChild
                defaultOpen={entry.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={entry.title}>
                      {entry.icon && <entry.icon />}
                      <span>{entry.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {entry.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <Link key={entry.title} to={entry.url}>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={entry.title}>
                  {entry.icon && <entry.icon />}
                  <span>{entry.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
