import { useDroppable } from '@dnd-kit/core'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ScrollArea,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/Global/components/atoms'
import { Muted } from '@/Global/components/molecules/Typography'
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
      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value={`workspace-${workspace.id}`} className="border-none">
          <Card>
            <CardHeader>
              <AccordionTrigger className="w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{workspace.name}</CardTitle>
                    {workspace.description && (
                      <CardDescription>{workspace.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Muted>({containers.length} containers)</Muted>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                          'data-[state=open]:rotate-90',
                        )}
                      />
                    </div>
                    <Link
                      to="/workspaces/$workspaceId"
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
                {containers.length === 0 ? (
                  <div className="flex items-center justify-center h-[100px]">
                    <Muted>No containers found for {workspace.name}. Add one to get started.</Muted>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] w-full pr-4">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 pb-4">
                      {containers.map((container) => (
                        <SortableContainerCard key={container.id} container={container} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
