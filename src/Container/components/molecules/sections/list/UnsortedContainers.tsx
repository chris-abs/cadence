import { useDroppable } from '@dnd-kit/core'

import { ScrollArea } from '@/Global/components/atoms'
import { H3 } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { SortableContainerCard } from '@/Container/components/atoms/card/SortableContainerCard'
import { Container } from '@/Container/types'

interface UnsortedContainersSectionProps {
  containers: Container[]
}

export function UnsortedContainersSection({ containers }: UnsortedContainersSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unsorted',
    data: {
      type: 'unsorted',
      workspaceId: undefined,
    },
  })

  return (
    <div
      className={cn('h-full flex flex-col transition-colors', isOver && 'bg-primary/5 rounded-lg')}
      ref={setNodeRef}
    >
      <div className="flex justify-between items-center mb-4">
        <H3>Unassigned Containers</H3>
        <span className="text-sm text-muted-foreground">({containers.length} containers)</span>
      </div>

      <ScrollArea
        className={cn(
          'flex-1 rounded-lg transition-colors',
          isOver && 'border-2 border-primary/20',
        )}
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2 pb-4">
          {containers.map((container) => (
            <SortableContainerCard key={container.id} container={container} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
