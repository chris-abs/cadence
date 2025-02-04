import { useState } from 'react'
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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/Global/components/atoms'
import { NoContent, Section, H3, H5, Muted, ViewToggle } from '@/Global/components/molecules'
import { formatRelativeTime } from '@/Global/utils/dateFormat'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { Item } from '@/Item/types'

interface ItemCatalogueProps {
  items: Item[]
}

export function ItemCatalogue({ items }: ItemCatalogueProps) {
  const { isCompact } = useSettingsStore()
  const [openSections, setOpenSections] = useState<string[]>(['tagged-items'])
  const isExpanded = openSections.includes('tagged-items')

  const sortedItems = items.filter((item) => item.container?.name)
  const unsortedItems = items.filter((item) => !item.container?.name)

  if (items.length === 0) {
    return <NoContent icon={Package} message="No items found. Create one to get started." />
  }

  return (
    <div
      className={cn(
        'transition-all duration-200',
        isExpanded ? (isCompact ? 'h-[255px]' : 'h-[355px]') : 'h-[150px]',
      )}
    >
      <Section className="h-full overflow-hidden">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="h-full"
        >
          <AccordionItem value="tagged-items" className="border-none h-full">
            <Card className="h-full">
              <CardHeader className="py-6">
                <AccordionTrigger className="hover:no-underline w-full [&[data-state=open]>svg]:rotate-180">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>Tagged Items</CardTitle>
                        <Muted>({items.length} items)</Muted>
                      </div>
                      <CardDescription className="text-muted-foreground m-0">
                        Items using this tag, organised by their container status
                      </CardDescription>
                    </div>
                    <ViewToggle />
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="p-0">
                  <ScrollArea className={cn(isCompact ? 'h-[100px]' : 'h-[200px]')}>
                    <div className="space-y-6 p-6">
                      {sortedItems.length > 0 && (
                        <div>
                          <H3 className="mb-4">Sorted ({sortedItems.length})</H3>
                          <ItemGrid items={sortedItems} isCompact={isCompact} />
                        </div>
                      )}

                      {unsortedItems.length > 0 && (
                        <div>
                          <H3 className="mb-4">Unsorted ({unsortedItems.length})</H3>
                          <ItemGrid items={unsortedItems} isCompact={isCompact} />
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </Section>
    </div>
  )
}

function ItemGrid({ items, isCompact }: { items: Item[]; isCompact: boolean }) {
  return (
    <div
      className={cn(
        'grid gap-4',
        isCompact
          ? 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'
          : 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
      )}
    >
      {items.map((item) => (
        <Link
          key={item.id}
          to="/items/$itemId"
          params={{ itemId: item.id.toString() }}
          className="block"
        >
          <Section
            className={cn(
              'overflow-hidden flex flex-col',
              isCompact ? 'h-[200px]' : 'h-[320px]',
              'transition-colors duration-200',
              'hover:border-primary/50',
              'bg-background hover:bg-contrast-accent',
            )}
          >
            <div className="w-full h-40 relative bg-muted">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0].url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
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
