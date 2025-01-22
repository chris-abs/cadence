import { useDroppable } from '@dnd-kit/core'

import {
  ScrollArea,
  ScrollBar,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ToggleGroup,
  ToggleGroupItem,
} from '@/Global/components/atoms'
import { H2, H3 } from '@/Global/components/molecules/Typography'
import { cn } from '@/Global/lib'
import { Workspace } from '@/Workspace/types'
import { Container } from '@/Container/types'
import { SortableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'

interface WorkspaceDropzoneListProps {
  workspaces: Workspace[]
  containers: Container[]
  visibleWorkspaceIds: Set<number>
  setVisibleWorkspaceIds: (ids: Set<number>) => void
}

export function WorkspaceDropzoneList({
  workspaces,
  containers,
  visibleWorkspaceIds,
  setVisibleWorkspaceIds,
}: WorkspaceDropzoneListProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <H2>Workspaces</H2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Filter Workspaces
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <ScrollArea className="h-[300px]">
              <ToggleGroup
                type="multiple"
                value={Array.from(visibleWorkspaceIds).map(String)}
                onValueChange={(values) => {
                  setVisibleWorkspaceIds(new Set(values.map(Number)))
                }}
                className="flex flex-col space-y-2"
              >
                {workspaces.map((workspace) => (
                  <ToggleGroupItem
                    key={workspace.id}
                    value={String(workspace.id)}
                    className="w-full justify-start"
                  >
                    {workspace.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {workspaces
            .filter((workspace) => visibleWorkspaceIds.has(workspace.id))
            .map((workspace) => (
              <WorkspaceSection
                key={workspace.id}
                workspace={workspace}
                containers={containers.filter((c) => c.workspaceId === workspace.id)}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface WorkspaceSectionProps {
  workspace: Workspace
  containers: Container[]
}

function WorkspaceSection({ workspace, containers }: WorkspaceSectionProps) {
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
            <div className="flex items-center justify-between w-full h-10">
              <div className="flex items-center gap-2">
                <H3>{workspace.name}</H3>
                <span className="text-xs text-muted-foreground">
                  ({containers.length} containers)
                </span>
              </div>
            </div>
          </AccordionTrigger>
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
