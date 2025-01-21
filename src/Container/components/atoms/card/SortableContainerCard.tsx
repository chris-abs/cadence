import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import { ContainerCard } from './Base'
import { Container } from '@/Container/types'

interface SortableContainerCardProps {
  container: Container | null
}

export function SortableContainerCard({ container }: SortableContainerCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: container ? `container-${container.id}` : 'placeholder',
  })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  if (!container) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <ContainerCard container={container} />
    </div>
  )
}
