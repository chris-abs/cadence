import { useDroppable } from '@dnd-kit/core'
import { Link } from '@tanstack/react-router'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ScrollArea,
  ScrollBar,
} from '@/Global/components/atoms'
import { H3, Muted } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { SortableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { Container } from '@/Container/types'
import { Workspace } from '@/Workspace/types'

interface WorkspaceListSectionProps {
  workspace: Workspace
  containers: Container[]
}

export function WorkspaceListSection({ workspace, containers }: WorkspaceListSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `workspace-${workspace.id}`,
    data: {
      type: 'workspace',
      workspaceId: workspace.id,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn('transition-colors', isOver && 'bg-primary/10 border-primary/20 rounded-lg')}
    >
      <Accordion type="single">
        <AccordionItem value="workspace">
          <AccordionTrigger parent>
            <div className="flex items-center justify-between leading-4 w-full h-10 ">
              <div className="flex items-center gap-2">
                <H3>{workspace.name}</H3>
                <span className="text-xs text-muted-foreground">
                  ({containers.length} containers)
                </span>
              </div>
              <Link
                to="/workspaces/$workspaceId"
                params={{ workspaceId: workspace.id.toString() }}
                className="hover:text-primary"
              >
                <Muted className="hover:text-foreground">Workspace Details →</Muted>
              </Link>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex">
              <ScrollArea type="always" className="w-1 flex-1">
                <div className="min-w-max">
                  <div
                    className={cn(
                      'flex gap-4 pb-4 relative',
                      isOver &&
                        containers.length > 0 &&
                        'translate-x-[296px] transition-transform duration-300',
                    )}
                  >
                    {containers.map((container) => (
                      <div key={container.id}>
                        {isOver && containers[0]?.id === container.id && (
                          <div
                            className="absolute left-0 top-0 border-2 border-dashed 
                           border-primary/30 rounded-lg flex items-center 
                           justify-center -translate-x-[296px]"
                            style={{
                              width: 280,
                              height: 120,
                            }}
                          >
                            <p className="text-sm text-muted-foreground">Drop here</p>
                          </div>
                        )}
                        <SortableContainerCard container={container} />
                      </div>
                    ))}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" className="w-full" />
              </ScrollArea>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
