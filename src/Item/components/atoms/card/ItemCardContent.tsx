import { Clock } from 'lucide-react'
import { Badge, PlaceholderImage, ScrollArea } from '@/Global/components/atoms'
import { H4, Muted } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { Item } from '@/Item/types'

interface ItemCardContentProps {
  item: Item | null
  className?: string
}

export function ItemCardContent({ item, className }: ItemCardContentProps) {
  const { isCompact } = useSettingsStore()

  if (!item) {
    return null
  }

  const baseCardClasses = cn(
    'rounded-lg border border-border',
    'bg-background hover:bg-contrast-accent',
    'transition-colors duration-200',
    'hover:border-primary/50',
    className,
  )

  if (isCompact) {
    return (
      <article className={cn(baseCardClasses, 'p-2 h-[100px]')}>
        <div className="flex flex-col h-full">
          <H4 className="truncate" id={`item-${item.id}-name`}>
            {item.name}
          </H4>
          <Muted className="text-xs">Qty: {item.quantity}</Muted>
          <Muted className="text-xs truncate mb-1">{item.description}</Muted>
          {item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-auto">
              {item.tags.map((tag) => (
                <Badge key={tag.id} tag={tag} className="text-[10px] px-1 py-0" />
              ))}
            </div>
          )}
        </div>
      </article>
    )
  }

  return (
    <article className={cn(baseCardClasses, 'overflow-hidden h-[200px] flex flex-col')}>
      <div className="w-full h-24 relative bg-muted">
        {item.images && item.images.length > 0 ? (
          <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <PlaceholderImage />
        )}
        <div
          className={cn(
            'absolute bottom-2 right-2 flex items-center gap-1.5',
            'px-2 py-0.5 rounded-md text-xs',
            'bg-background/90 border border-border',
          )}
        >
          <Clock className="w-3 h-3" />
          <Muted className="!text-foreground">{formatRelativeTime(item.updatedAt)}</Muted>
        </div>
      </div>

      <div className="px-3 pt-2 flex flex-col flex-1">
        <div className="mb-2">
          <H4 className="truncate" id={`item-${item.id}-name`}>
            {item.name}
          </H4>
          <div className="flex items-center justify-between">
            <Muted>Qty: {item.quantity}</Muted>
            {item.container && <Muted className="truncate">{item.container.name}</Muted>}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {item.tags && item.tags.length > 0 && (
            <ScrollArea className="h-[2.5rem] -mr-2 pr-2">
              <div className="space-y-1" role="list" aria-label="Item tags">
                {item.tags.map((tag) => (
                  <div key={tag.id} className="w-full">
                    <Badge tag={tag} className="w-full truncate" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </article>
  )
}
