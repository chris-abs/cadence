import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  AppSidebar,
} from '@/components'
import { Separator } from '@radix-ui/react-dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const auth = useAuth()

  if (!auth.isLogged()) {
    return (
      <div className="min-h-screen">
        <header className="h-16 border-b flex items-center px-4">
          <div className="flex items-center gap-4 ml-auto">
            <Link to="/login" className="text-sm font-medium text-gray-900 hover:text-gray-700">
              Login
            </Link>
            <Link to="/register" className="text-sm font-medium text-gray-900 hover:text-gray-700">
              Register
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 px-4 h-16 border-b">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mx-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <button
              onClick={() => {
                auth.logout()
                window.location.href = '/login'
              }}
              className="text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
