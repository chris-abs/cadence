import { Link } from '@tanstack/react-router'
import { LucideIcon } from 'lucide-react'

import { EntityType } from '@/Storage/Collection/types'
interface EntityEntryProps {
  id: number
  name: string
  type: EntityType
  icon: LucideIcon
  description?: string
  onClick?: () => void
}

const typeToRoute = {
  workspace: (id: number) => `/cadence/storage/workspaces/${id}`,
  container: (id: number) => `/cadence/storage/containers/${id}`,
  item: (id: number) => `/cadence/storage/items/${id}`,
  tag: (id: number) => `/cadence/storage/tags/${id}`,
} as const

export function EntityEntry({ id, name, type, icon: Icon, onClick }: EntityEntryProps) {
  return (
    <div className="bg-contrast-accent border rounded-md">
      <Link
        to={typeToRoute[type](id)}
        className="flex items-center gap-2 p-3 hover:bg-contrast-accent-hover"
        onClick={onClick}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{name}</span>
      </Link>
    </div>
  )
}
