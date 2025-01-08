import { Link } from '@tanstack/react-router'
import { LucideIcon } from 'lucide-react'
import type { EntityType } from '@/types/collection'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/atoms'

interface EntityCardProps {
  type: EntityType
  icon: LucideIcon
  count?: number
  recentItems?: Array<{ id: number; name: string; image?: string }>
}

export function EntityCard({ type, icon: Icon, count, recentItems }: EntityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <CardTitle className="capitalize">{type}s</CardTitle>
          </div>
          <CardDescription className="text-xl font-semibold text-foreground">
            {count || 0}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {recentItems?.slice(0, 5).map((item) => (
          <Link
            key={item.id}
            // to={`/${type}s/${item.id}`}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <Icon className="h-8 w-8 p-1.5 text-muted-foreground" />
            )}
            <span className="flex-1 truncate text-sm">{item.name}</span>
          </Link>
        ))}
      </CardContent>

      <CardFooter className="justify-end">
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
