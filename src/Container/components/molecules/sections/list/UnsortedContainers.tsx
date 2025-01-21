import { useDroppable } from '@dnd-kit/core'
import { Box } from 'lucide-react'

import { ScrollArea } from '@/Global/components/atoms'
import { NoContent } from '@/Global/components/molecules'
import { Container } from '@/Container/types'
import { DraggableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { cn } from '@/Global/lib'

interface UnsortedContainersSectionProps {
  containers: Container[]
  isOver: boolean
}

export function UnsortedContainersSection({ containers, isOver }: UnsortedContainersSectionProps) {
  const { setNodeRef } = useDroppable({
    id: 'unsorted',
  })

  return (
    <div
      ref={setNodeRef}
      className={cn('h-full flex flex-col transition-colors', isOver && 'bg-primary/5 rounded-lg')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          <h3 className="text-xl font-semibold">Unsorted Containers</h3>
        </div>
        <span className="text-sm text-muted-foreground">({containers.length} containers)</span>
      </div>

      <ScrollArea
        className={cn(
          'flex-1 rounded-lg transition-colors',
          isOver && 'border-2 border-primary/20',
        )}
      >
        <div className="space-y-2 pb-4">
          {containers.length > 0 ? (
            containers.map((container) => (
              <DraggableContainerCard key={container.id} container={container} />
            ))
          ) : (
            <NoContent message="No unsorted containers" />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
