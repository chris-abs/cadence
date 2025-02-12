import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronRight } from 'lucide-react'

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
import { Section } from '@/Global/components/molecules'
import { Muted } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'
import { SortableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { Container } from '@/Container/types'

interface UnassignedContainersSectionProps {
  containers: Container[]
}

export function UnassignedContainersSection({ containers }: UnassignedContainersSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unsorted' })
  const [openSections, setOpenSections] = useState<string[]>(['unsorted'])
  const isExpanded = openSections.includes('unsorted')

  return (
    <div
      ref={setNodeRef}
      className={cn('transition-all duration-200', isExpanded ? 'h-[355px]' : 'h-[150px]')}
    >
      <Section className="h-full overflow-hidden">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="h-full"
        >
          <AccordionItem value="unsorted" className="border-none h-full">
            <Card
              className={cn(
                'transition-all duration-200 h-full',
                isOver && 'bg-primary/5 border-primary/20',
              )}
            >
              <CardHeader className="py-6">
                <AccordionTrigger className="hover:no-underline w-full">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>Unassigned Containers</CardTitle>
                        <Muted>({containers.length} containers)</Muted>
                      </div>
                      <CardDescription className="text-muted-foreground m-0">
                        All new Containers will be placed here! Drag them into Workspaces to sort
                        them
                      </CardDescription>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                        isExpanded && 'rotate-90',
                      )}
                    />
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 pb-4">
                      {containers.map((container) => (
                        <div
                          key={container.id}
                          className={cn(
                            'transition-opacity duration-200',
                            isExpanded ? 'opacity-100' : 'opacity-0',
                          )}
                        >
                          <SortableContainerCard container={container} />
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
