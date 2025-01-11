import { LucideIcon } from 'lucide-react'
import type { EntityType } from '@/types/collection'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/atoms'
import { Link } from '@tanstack/react-router'
import { EntityEntry } from './EntityEntry'

interface EntityCardProps {
  type: EntityType
  icon: LucideIcon
  count?: number
  recentItems?: Array<{ id: number; name: string; description?: string }>
}

export function EntityCard({ type, icon: Icon, count, recentItems }: EntityCardProps) {
  return (
    <Card className="flex flex-col min-h-[320px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <CardTitle className="capitalize">{type}s</CardTitle>
          </div>
          <span className="text-xl font-semibold">{count || 0}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-1">
        <div className="grid grid-cols-1 gap-2">
          {recentItems?.map((item) => (
            <EntityEntry
              key={item.id}
              id={item.id}
              name={item.name}
              type={type}
              icon={Icon}
              description={item.description}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter className="justify-end mt-auto">
        <Link
          to={`/${type}s`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          View all {type}s →
        </Link>
      </CardFooter>
    </Card>
  )
}
