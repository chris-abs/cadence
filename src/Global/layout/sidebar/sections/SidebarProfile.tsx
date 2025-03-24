// src/Global/layout/sidebar/sections/SidebarUser.tsx
import { Link, useNavigate } from '@tanstack/react-router'
import { BadgeCheck, Bell, ChevronsUpDown, LogOut, Settings2, UserCircle2 } from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/Global/layout/sidebar/sections/SidebarFoundation'
import { useAuth } from '@/Global/hooks/useAuth'
import { useActiveProfile } from '@/Profile/queries/profile'

export function SidebarProfile() {
  const { data: profile, isLoading } = useActiveProfile()
  const { isMobile } = useSidebar()
  const { logout } = useAuth()
  const navigate = useNavigate()

  if (isLoading || !profile) return null

  const profileInitial = profile.name.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const handleSwitchProfile = () => {
    navigate({ to: '/profile/select' })
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
              <Avatar className="h-8 w-8 rounded-lg">
                {profile.imageUrl ? (
                  <AvatarImage src={profile.imageUrl} alt={profile.name} />
                ) : (
                  <AvatarFallback className="rounded-lg bg-contrast-accent">
                    {profileInitial}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate capitalize font-semibold">{profile.name}</span>
                <span className="truncate text-xs capitalize">{profile.role.toLowerCase()}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {profile.imageUrl ? (
                    <AvatarImage src={profile.imageUrl} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="rounded-lg bg-contrast-accent">
                      {profileInitial}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate capitalize font-semibold">{profile.name}</span>
                  <span className="truncate text-xs capitalize">{profile.role.toLowerCase()}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSwitchProfile}>
                <UserCircle2 className="mr-2 h-4 w-4" />
                Switch Profile
              </DropdownMenuItem>
              <Link to="/settings" search={{ tab: 'preferences' }}>
                <DropdownMenuItem>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem disabled>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <Link to="/settings" search={{ tab: 'profile' }}>
                <DropdownMenuItem>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
