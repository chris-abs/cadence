import React from 'react'

interface AuthPageWrapperProps {
  children: React.ReactNode
}

export function AuthPageWrapper({ children }: AuthPageWrapperProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-sidebar-primary/5 blur-2xl" />

      <div className="relative z-10 grid min-h-screen place-items-center px-4">{children}</div>
    </div>
  )
}
