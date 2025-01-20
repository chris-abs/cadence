import { Box, LucideIcon } from 'lucide-react'
import { Muted } from './Typography'

interface NoContentProps {
  message: string
  icon?: LucideIcon
}

export function NoContent({ message, icon: Icon = Box }: NoContentProps) {
  return (
    <div
      className="flex h-32 items-center justify-center rounded-md border border-dashed"
      role="status"
      aria-label="No content found"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <Muted>{message}</Muted>
      </div>
    </div>
  )
}
