import { Link } from '@tanstack/react-router'
import { Clock, Package } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  PlaceholderImage,
  ScrollArea,
} from '@/Global/components/atoms'
import { NoContent, Section, H3, H5, Muted } from '@/Global/components/molecules'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { cn } from '@/Global/lib'
import { Item } from '@/Item/types'

interface ItemListProps {
  items: Item[]
}

export function ItemList({ items }: ItemListProps) {
  const sortedItems = items.filter((item) => item.container?.name)
  const unsortedItems = items.filter((item) => !item.container?.name)

  if (items.length === 0) {
    return <NoContent icon={Package} message="No items found. Create one to get started." />
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <Accordion type="multiple" defaultValue={['sorted', 'unsorted']} className="space-y-4">
        {sortedItems.length > 0 && (
          <AccordionItem border value="sorted">
            <AccordionTrigger parent>
              <H3>Sorted ({sortedItems.length})</H3>
            </AccordionTrigger>
            <AccordionContent>
              <ItemGrid items={sortedItems} />
            </AccordionContent>
          </AccordionItem>
        )}

        {unsortedItems.length > 0 && (
          <AccordionItem border value="unsorted">
            <AccordionTrigger parent>
              <H3>Unsorted ({unsortedItems.length})</H3>
            </AccordionTrigger>
            <AccordionContent>
              <ItemGrid items={unsortedItems} />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </ScrollArea>
  )
}

function ItemGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          to="/items/$itemId"
          params={{ itemId: item.id.toString() }}
          className="block max-w-md"
        >
          <Section
            className={cn(
              'overflow-hidden h-[320px] flex flex-col',
              'transition-colors duration-200',
              'hover:border-primary/50',
              'bg-background hover:bg-contrast-accent',
            )}
          >
            <div className="w-full h-40 relative bg-muted">
              {item.imgUrl ? (
                <img src={item.imgUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <PlaceholderImage />
              )}
              <div
                className={cn(
                  'absolute bottom-2 right-2 flex items-center gap-1.5',
                  'px-2 py-1 rounded-md text-xs',
                  'bg-background/90 text-foreground',
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRelativeTime(item.updatedAt || item.createdAt)}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col flex-1">
              <div className="mb-3">
                <H5 className="font-semibold truncate text-foreground" id={`item-${item.id}-name`}>
                  {item.name}
                </H5>
                <Muted className="flex items-center justify-between text-muted-foreground">
                  <span>Quantity: {item.quantity}</span>
                  {item.container && <span>{item.container.name}</span>}
                </Muted>
              </div>

              <div className="flex-1 min-h-0">
                {item.tags && item.tags.length > 0 && (
                  <ScrollArea className="h-[4.5rem] -mr-3 pr-3">
                    <div className="space-y-1.5" role="list" aria-label="Item tags">
                      {item.tags.map((tag) => (
                        <div key={tag.id} className="w-full">
                          <Badge tag={tag} className="w-full text-xs truncate" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </Section>
        </Link>
      ))}
    </div>
  )
}

export default ItemList
