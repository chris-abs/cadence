import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/molecules'
import { Separator } from '@radix-ui/react-dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './sidebar'
import { AppSidebar } from './AppSidebar'
import { useBreadcrumbs } from '@/lib/breadcrumbs'

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const auth = useAuth()
  const breadcrumbs = useBreadcrumbs()

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
      <SidebarInset className="flex flex-col h-screen">
        <div className="flex items-center gap-2 px-4 h-16 border-b shrink-0">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mx-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.label}>
                  <BreadcrumbItem className="hidden md:block">
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href || ''}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <main className="flex-1 bg-contrast-accent overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
