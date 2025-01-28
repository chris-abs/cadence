import { useDroppable } from '@dnd-kit/core'
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
import { Muted } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'
import { Workspace } from '@/Workspace/types'
import { Container } from '@/Container/types'
import { SortableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'

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
      <Card>
        <CardHeader>
          <AccordionTrigger className="hover:no-underline w-full">
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-col gap-1">
                <CardTitle>{workspace.name}</CardTitle>
                {workspace.description && (
                  <CardDescription className="text-muted-foreground">
                    {workspace.description}
                  </CardDescription>
                )}
              </div>
              <Muted>({containers.length} containers)</Muted>
            </div>
          </AccordionTrigger>
        </CardHeader>
        <AccordionContent>
          <CardContent>
            <div className="flex">
              <ScrollArea type="always" className="w-1 flex-1">
                <div className="min-w-max">
                  <div
                    ref={setNodeRef}
                    className={cn(
                      'flex gap-4 pb-4 relative',
                      isOver && 'translate-x-[296px] transition-transform duration-300',
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
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </CardContent>
        </AccordionContent>
      </Card>
    </AccordionItem>
  )
}
