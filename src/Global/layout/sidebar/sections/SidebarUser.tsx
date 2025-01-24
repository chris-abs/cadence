import { Link, useRouter } from '@tanstack/react-router'
import { BadgeCheck, Bell, ChevronsUpDown, LogOut, Settings2 } from 'lucide-react'

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
import {} from '@/Global/components/atoms/DropDownMenu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/Global/layout/sidebar/sections/SidebarFoundation'
import { useAuth } from '@/Global/hooks/useAuth'
import { useUser } from '@/User/queries/user'

export function SidebarUser() {
  const { data: user, isLoading } = useUser()
  const { isMobile } = useSidebar()
  const { logout } = useAuth()
  const router = useRouter()

  if (isLoading || !user) return null

  const userInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  const handleLogout = () => {
    logout()
    router.navigate({ to: '/login' })
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
                {user.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <AvatarFallback className="rounded-lg bg-contrast-accent">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate capitalize font-semibold">{`${user.firstName} ${user.lastName}`}</span>
                <span className="truncate text-xs">{user.email}</span>
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
                  {user.imageUrl ? (
                    <AvatarImage src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} />
                  ) : (
                    <AvatarFallback className="rounded-lg bg-contrast-accent">
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate capitalize font-semibold">{`${user.firstName} ${user.lastName}`}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link to="/profile">
                <DropdownMenuItem>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem disabled>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <Link to="/settings">
                <DropdownMenuItem>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
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
