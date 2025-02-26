import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'

import {
  ScrollArea,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/Global/components/atoms'
import { Section, Muted, ViewToggle } from '@/Global/components/molecules'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { SortableItemCard } from '@/Storage/Item/components/atoms/card/SortableItemCard'
import { Item } from '@/Storage/Item/types'

interface UnassignedItemsSectionProps {
  items: Item[]
}

export function UnassignedItemsSection({ items }: UnassignedItemsSectionProps) {
  const { isCompact } = useSettingsStore()
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })
  const [openSections, setOpenSections] = useState<string[]>(['unassigned'])
  const isExpanded = openSections.includes('unassigned')

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-all duration-200',
        isExpanded ? (isCompact ? 'h-[290px]' : 'h-[365px]') : 'h-[150px]',
      )}
    >
      <Section className="h-full overflow-hidden">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="h-full"
        >
          <AccordionItem value="unassigned" className="border-none h-full">
            <Card
              className={cn(
                'transition-all duration-200 h-full',
                isOver && 'bg-primary/5 border-primary/20',
              )}
            >
              <CardHeader className="py-6">
                <AccordionTrigger parent className="hover:no-underline w-full">
                  <div className="flex justify-between items-center pr-6 w-full">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>Unassigned Items</CardTitle>
                        <Muted>({items.length} items)</Muted>
                      </div>
                      <CardDescription className="text-muted-foreground m-0">
                        All new Items will be placed here! Drag them into Containers to assign them
                      </CardDescription>
                    </div>
                    <ViewToggle />
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent>
                  <ScrollArea className={cn(isCompact ? 'h-[125px]' : 'h-[200px]')}>
                    <div
                      className={cn(
                        'grid gap-4 pb-4',
                        isCompact
                          ? 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'
                          : 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
                      )}
                    >
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'transition-opacity duration-200',
                            isExpanded ? 'opacity-100' : 'opacity-0',
                          )}
                        >
                          <SortableItemCard item={item} />
                        </div>
                      ))}
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
