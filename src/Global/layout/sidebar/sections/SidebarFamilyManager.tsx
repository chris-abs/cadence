import { ChevronsUpDown, Plus, Settings, Home, Crown } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/Global/layout/sidebar/sections/SidebarFoundation'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'

export function SidebarFamilyManager() {
  const { isMobile } = useSidebar()
  const { profile, family, isParent, hasFamily } = useProfileWithFamily()
  const navigate = useNavigate()

  if (!hasFamily) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Home className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Cadence</span>
              <span className="truncate text-xs">Family Platform</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-contrast-accent data-[state=open]:text-contrast-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Crown className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{family?.familyName || 'My Family'}</span>
                <span className="truncate text-xs capitalize">
                  {profile?.role?.toLowerCase() || 'Member'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <div className="gap-2 p-2 cursor-default">
              <div className="flex flex-col">
                <span className="font-medium">{family?.familyName}</span>
                <span className="text-xs text-muted-foreground">ID: {family?.id}</span>
              </div>
            </div>

            <DropdownMenuSeparator />

            <Link to="/cadence">
              <DropdownMenuItem className="gap-2 p-2">
                <Home className="size-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
            </Link>

            {isParent && (
              <>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => navigate({ to: '/settings', search: { tab: 'family' } })}
                >
                  <Settings className="size-4" />
                  <span>Family Settings</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => navigate({ to: '/profile/select' })}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium">Switch Profile</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
