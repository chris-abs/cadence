import { Box } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'

import { Container } from '@/Container/types'
import { Workspace } from '@/Workspace/types'
import { NoContent } from '@/Global/components/molecules'
import { DraggableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'

interface WorkspaceDropZoneProps {
  workspace: Workspace
  containers: Container[]
  isOver: boolean
}

export function WorkspaceDropZone({ workspace, containers, isOver }: WorkspaceDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `workspace-${workspace.id}`,
  })

  const workspaceContainers = containers.filter((c) => c.workspaceId === workspace.id)

  return (
    <div
      ref={setNodeRef}
      className={`
        space-y-2 rounded-lg border-2 border-dashed p-4
        transition-all duration-200
        ${isOver ? 'border-primary bg-primary/5 scale-102' : 'border-muted'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          <h3 className="font-medium">{workspace.name}</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {workspaceContainers.length} containers
        </span>
      </div>

      {workspaceContainers.length > 0 ? (
        <div className="space-y-2">
          {workspaceContainers.map((container) => (
            <DraggableContainerCard key={container.id} container={container} />
          ))}
        </div>
      ) : (
        <div className="py-8">
          <NoContent message="Drop containers here" />
        </div>
      )}
    </div>
  )
}
