import { type LucideIcon, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/Global/components/atoms'

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
              <Popover key={entry.title}>
                <PopoverTrigger asChild>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip={entry.title}>
                      {entry.icon && <entry.icon />}
                      <span>{entry.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-48 p-2" align="start" sideOffset={12}>
                  <div className="flex flex-col gap-1">
                    {entry.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        to={subItem.url}
                        className="flex h-8 w-full items-center rounded-md px-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
