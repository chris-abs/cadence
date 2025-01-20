import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useDroppable } from '@dnd-kit/core'
import { Package } from 'lucide-react'

import {
  ScrollArea,
  ScrollBar,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/Global/components/atoms'
import { Muted, NoContent } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { Container } from '@/Container/types'
import { SortableItemCard } from '@/Item/components/atoms/card/SortableItemCard'
import { Item } from '@/Item/types'
import { CompactItemCard } from '@/Item/components/atoms/card/CompactItemCard'

interface ContainerRowProps {
  container: Container
  items: Item[]
  isCompactView: boolean
}

export function ContainerRow({ container, items, isCompactView }: ContainerRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${container.id}`,
    data: {
      type: 'container',
      containerId: container.id,
    },
  })

  const [open, setOpen] = useState(true)
  const ItemComponent = isCompactView ? CompactItemCard : SortableItemCard
  const cardWidth = isCompactView ? 200 : 280

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'px-4 py-3 border-t first:border-t-0 transition-colors',
        isOver && 'bg-primary/10 border-primary/20',
      )}
    >
      <Accordion type="single" value={open ? 'container' : ''}>
        <AccordionItem value="container">
          <AccordionTrigger onClick={() => setOpen(!open)}>
            <div className="flex items-center justify-between w-full h-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{container.name}</span>
                <span className="text-xs text-muted-foreground">({items.length} items)</span>
              </div>
              <Link
                to="/containers/$containerId"
                params={{ containerId: container.id.toString() }}
                className="hover:text-primary"
              >
                <Muted className="hover:text-foreground">Container Details →</Muted>
              </Link>
            </div>
          </AccordionTrigger>

          {open && (
            <AccordionContent>
              <div className="flex">
                <ScrollArea type="always" className="w-1 flex-1">
                  <div className="min-w-max">
                    <div
                      className={cn(
                        'flex gap-4 pb-4 relative',
                        isOver && 'translate-x-[296px] transition-transform duration-300',
                      )}
                    >
                      {items.length === 0 ? (
                        <div className="w-full">
                          <NoContent
                            icon={Package}
                            message={`No items found for ${container.name}. Add one to get started`}
                          />
                        </div>
                      ) : (
                        items.map((item) => (
                          <div key={item.id}>
                            {isOver && items[0]?.id === item.id && (
                              <div
                                className="absolute left-0 top-0 border-2 border-dashed 
                                         border-primary/30 rounded-lg flex items-center 
                                         justify-center -translate-x-[296px]"
                                style={{
                                  width: cardWidth,
                                  height: isCompactView ? '100px' : '200px',
                                }}
                              >
                                <p className="text-sm text-muted-foreground">Drop here</p>
                              </div>
                            )}
                            <ItemComponent item={item} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <ScrollBar orientation="horizontal" className="w-full" />
                </ScrollArea>
              </div>
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  )
}
