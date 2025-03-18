import { ChevronRight } from 'lucide-react'
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
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'
import { ModuleID } from '@/Family/types'
import { SidebarPopover } from './SidebarPopover'
import { navigationConfig } from './SidebarConfig'

export function SidebarCore() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { family } = useProfileWithFamily()

  const enabledModules = family?.modules.filter((m) => m.isEnabled).map((m) => m.id) || []

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Cadence</SidebarGroupLabel>
        <SidebarMenu>
          <Link to={navigationConfig.navMain.dashboard.url}>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={navigationConfig.navMain.dashboard.title}>
                {navigationConfig.navMain.dashboard.icon && (
                  <navigationConfig.navMain.dashboard.icon />
                )}
                <span>{navigationConfig.navMain.dashboard.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarMenu>
      </SidebarGroup>

      {enabledModules.map((moduleId) => (
        <ModuleSection key={moduleId} moduleId={moduleId as ModuleID} isCollapsed={isCollapsed} />
      ))}
    </>
  )
}

interface ModuleSectionProps {
  moduleId: ModuleID
  isCollapsed: boolean
}

function ModuleSection({ moduleId, isCollapsed }: ModuleSectionProps) {
  const moduleConfig = navigationConfig.navMain.modules[moduleId]
  if (!moduleConfig || moduleConfig.length === 0) return null

  const moduleLabels: Record<ModuleID, string> = {
    storage: 'Storage',
    meals: 'Meals',
    chores: 'Chores',
    services: 'Services',
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{moduleLabels[moduleId]}</SidebarGroupLabel>
      <SidebarMenu>
        {moduleConfig.map((entry) => {
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
                defaultOpen={false}
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
