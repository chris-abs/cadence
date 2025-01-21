import { useDraggable } from '@dnd-kit/core'

import { ContainerCard } from './Base'
import { Container } from '@/Container/types'

interface DraggableContainerCardProps {
  container: Container | null
}

export function DraggableContainerCard({ container }: DraggableContainerCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: container ? `container-${container.id}` : 'placeholder',
  })

  if (!container) return null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <ContainerCard container={container} />
    </div>
  )
}
