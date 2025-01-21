import { FolderOpen } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ScrollArea,
} from '@/Global/components/atoms'
import { NoContent } from '@/Global/components/molecules'
import { DraggableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { Container } from '@/Container/types'

interface UnsortedContainersSectionProps {
  containers: Container[]
}

export function UnsortedContainersSection({ containers }: UnsortedContainersSectionProps) {
  return (
    <Accordion type="single" collapsible defaultValue="unassigned">
      <AccordionItem value="unassigned">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <span>Unassigned Containers</span>
            <span className="text-sm text-muted-foreground ml-2">({containers.length})</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 p-2">
              {containers.length > 0 ? (
                containers.map((container) => (
                  <DraggableContainerCard key={container.id} container={container} />
                ))
              ) : (
                <NoContent message="No unassigned containers" />
              )}
            </div>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
