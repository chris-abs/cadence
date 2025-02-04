import { useState } from 'react'
import { Package } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ScrollArea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/Global/components/atoms'
import { NoContent, Section, H3, Muted, ViewToggle } from '@/Global/components/molecules'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { Item } from '@/Item/types'
import { ItemCard } from '@/Item/components/atoms/card'

interface ItemCatalogueProps {
  items: Item[]
  emptyStateComponent?: React.ReactNode
}

// TODO: prop to update card header title and description depending which page we're on

export function ItemCatalogue({ items, emptyStateComponent }: ItemCatalogueProps) {
  const [openSections, setOpenSections] = useState<string[]>(['tagged-items'])

  if (!items?.length) {
    return (
      emptyStateComponent || (
        <NoContent icon={Package} message="No items found. Create one to get started." />
      )
    )
  }

  const sortedItems = items.filter((item) => item.container?.name)
  const unsortedItems = items.filter((item) => !item.container?.name)

  return (
    <div className={cn('transition-all duration-200')}>
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
                <div className="flex justify-between items-center w-full">
                  <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>Tagged Items</CardTitle>
                        <Muted>({items.length} items)</Muted>
                      </div>
                      <CardDescription className="text-muted-foreground m-0">
                        Items using this tag, organised by their container status
                      </CardDescription>
                    </div>
                  </AccordionTrigger>
                  <ViewToggle />
                </div>
              </CardHeader>
              <AccordionContent>
                <CardContent className="p-0">
                  <ScrollArea>
                    <div className="space-y-6 p-6">
                      {sortedItems.length > 0 && (
                        <div>
                          <H3 className="mb-4">Sorted ({sortedItems.length})</H3>
                          <ItemGrid items={sortedItems} />
                        </div>
                      )}

                      {unsortedItems.length > 0 && (
                        <div>
                          <H3 className="mb-4">Unsorted ({unsortedItems.length})</H3>
                          <ItemGrid items={unsortedItems} />
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

function ItemGrid({ items }: { items: Item[] }) {
  const { isCompact } = useSettingsStore()

  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.id} className={cn('shrink-0', isCompact ? 'w-[200px]' : 'w-[280px]')}>
          <ItemCard item={item} />
        </div>
      ))}
    </div>
  )
}
