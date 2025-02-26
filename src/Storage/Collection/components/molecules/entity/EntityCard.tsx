import { LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  ScrollArea,
} from '@/Global/components/atoms'
import { Muted } from '@/Global/components/molecules'
import { EntityEntry } from './EntityEntry'
import { EntityType } from '@/Storage/Collection/types'

interface EntityCardProps {
  type: EntityType
  icon: LucideIcon
  count?: number
  recentItems?: Array<{ id: number; name: string; description?: string }>
}

export function EntityCard({ type, icon: Icon, count, recentItems }: EntityCardProps) {
  return (
    <Card className="flex flex-col h-[475px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <CardTitle className="capitalize">{type}s</CardTitle>
          </div>
          <span className="text-xl font-semibold">{count || 0}</span>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="space-y-1">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {recentItems?.map((item) => (
              <EntityEntry key={item.id} id={item.id} name={item.name} type={type} icon={Icon} />
            ))}
          </div>
        </CardContent>
      </ScrollArea>

      <CardFooter className="justify-end align-middle pt-4">
        <Link to={`/${type}s`}>
          <Muted className="hover:text-foreground">View all {type}s →</Muted>
        </Link>
      </CardFooter>
    </Card>
  )
}
