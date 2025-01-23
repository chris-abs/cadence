import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'

import { ContainerCard } from './Base'
import { Container } from '@/Container/types'

interface SortableContainerCardProps {
  container: Container | null
}

export function SortableContainerCard({ container }: SortableContainerCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: container ? `container-${container.id}` : 'placeholder',
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!container) return null

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContainerCard container={container} />
    </div>
  )
}
