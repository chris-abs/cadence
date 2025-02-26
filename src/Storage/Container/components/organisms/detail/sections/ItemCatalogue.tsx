import { useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@/Global/components/atoms'
import { Muted, Section, ViewToggle } from '@/Global/components/molecules'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { ItemCard } from '@/Item/components/atoms/card'
import { Item } from '@/Item/types'

interface ItemCatalogueProps {
  items: Item[]
  emptyStateComponent?: React.ReactNode
}

export function ItemCatalogue({ items, emptyStateComponent }: ItemCatalogueProps) {
  const [openSections, setOpenSections] = useState<string[]>(['container-items'])
  const { isCompact } = useSettingsStore()

  if (!items?.length) {
    return emptyStateComponent || null
  }

  return (
    <div className="transition-all duration-200">
      <Section className="h-full overflow-hidden">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="h-full"
        >
          <AccordionItem value="container-items" className="border-none h-full">
            <Card className="h-full">
              <CardHeader className="py-6">
                <div className="flex justify-between items-center w-full">
                  <AccordionTrigger className="hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>Container Items</CardTitle>
                        <Muted>({items.length} items)</Muted>
                      </div>
                      <CardDescription className="text-muted-foreground m-0">
                        Items stored in this container
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
                      <div className="flex flex-wrap gap-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={cn('shrink-0', isCompact ? 'w-[200px]' : 'w-[280px]')}
                          >
                            <ItemCard item={item} />
                          </div>
                        ))}
                      </div>
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
