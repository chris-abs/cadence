import React from 'react'
import { Link } from '@tanstack/react-router'
import { Separator } from '@radix-ui/react-dropdown-menu'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/molecules'
import { useAuth } from '@/Global/hooks/useAuth'
import { useBreadcrumbs } from '@/Global/lib/breadcrumbs'
import { AppSidebar, SidebarInset, SidebarProvider, SidebarTrigger } from './sidebar'
import { QrSearch } from '../components/molecules/search/scanner'
import { useActiveProfile } from '@/Profile/queries/profile'

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  const auth = useAuth()
  const { data: activeProfile } = useActiveProfile()
  const breadcrumbs = useBreadcrumbs()

  if (!auth.isLogged()) {
    return (
      <div className="min-h-screen">
        <header className="h-16 border-b flex items-center">
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

  if (!activeProfile && window.location.pathname === '/cadence/profile-select') {
    return <main>{children}</main>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <div className="flex items-center gap-2 px-4 h-16 border-b shrink-0">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
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
            <QrSearch />
          </div>
        </div>
        <main className="flex-1 bg-contrast-accent overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
