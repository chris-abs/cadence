import { useUser } from '@/queries/users'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/DropDownMenu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/layouts/sidebar'
import { BadgeCheck, Bell, ChevronsUpDown, LogOut, Settings2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from '@tanstack/react-router'

export function NavUser() {
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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.imageUrl ? (
                  <AvatarImage src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
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
                    <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
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
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings2 className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
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
