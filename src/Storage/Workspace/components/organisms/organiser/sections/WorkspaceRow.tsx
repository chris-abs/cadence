import { useDroppable } from '@dnd-kit/core'
import { FolderOpen } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ScrollArea,
  ScrollBar,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/Global/components/atoms'
import { NoContent, Muted } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { Workspace } from '@/Storage/Workspace/types'
import { SortableContainerCard } from '@/Storage/Container/components/atoms/card/SortableContainerCard'
import { Container } from '@/Storage/Container/types'

interface WorkspaceRowProps {
  workspace: Workspace
  containers: Container[]
}

export function WorkspaceRow({ workspace, containers }: WorkspaceRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `workspace-${workspace.id}`,
    data: { type: 'workspace', workspaceId: workspace.id },
  })

  return (
    <AccordionItem value={`workspace-${workspace.id}`} className="border-none">
      <div ref={setNodeRef} className="h-full">
        <Card
          className={cn('transition-all duration-200', isOver && 'bg-primary/5 border-primary/20')}
        >
          <CardHeader>
            <AccordionTrigger parent className="hover:no-underline w-full">
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{workspace.name}</CardTitle>
                    <Muted>({containers.length} containers)</Muted>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {workspace.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1">
                  <Link
                    to="/cadence/storage/workspaces/$workspaceId"
                    params={{ workspaceId: workspace.id.toString() }}
                    className="hover:text-primary"
                  >
                    <Muted className="hover:text-foreground">Workspace Details →</Muted>
                  </Link>
                </div>
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent>
              <div className="flex">
                <ScrollArea type="always" className="w-1 flex-1">
                  <div className="min-w-max">
                    <div
                      className={cn(
                        'flex gap-4 pb-4 relative transition-all duration-300 ease-in-out',
                        isOver && 'translate-x-[320px] w-[calc(100%-350px)]',
                      )}
                    >
                      {containers.length === 0 ? (
                        <div className="w-full">
                          <NoContent
                            icon={FolderOpen}
                            message={`No containers found for ${workspace.name}. Add one to get started`}
                          />
                        </div>
                      ) : (
                        containers.map((container) => (
                          <div key={container.id}>
                            {isOver && containers[0]?.id === container.id && (
                              <div
                                className="absolute left-0 top-0 border-2 border-dashed 
                                           border-primary/30 rounded-lg flex items-center 
                                           justify-center -translate-x-[320px] w-[280px] h-[120px]"
                              >
                                <p className="text-sm text-muted-foreground">Drop here</p>
                              </div>
                            )}
                            <SortableContainerCard container={container} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </CardContent>
          </AccordionContent>
        </Card>
      </div>
    </AccordionItem>
  )
}
