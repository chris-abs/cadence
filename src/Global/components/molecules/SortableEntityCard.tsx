import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { WithDrag } from './WithDrag'

interface SortableEntity {
  id: number
}

interface SortableEntityCardProps<T extends SortableEntity> {
  entity: T | null
  type: 'item' | 'container'
  children: React.ReactNode
}

export function SortableEntityCard<T extends SortableEntity>({
  entity,
  type,
  children,
}: SortableEntityCardProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: entity ? `${type}-${entity.id}` : 'placeholder',
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!entity) return null

  const routeMap = {
    item: '/items/$itemId',
    container: '/containers/$containerId',
  }

  const paramMap = {
    item: 'itemId',
    container: 'containerId',
  }

  return (
    <WithDrag to={routeMap[type]} params={{ [paramMap[type]]: entity.id.toString() }}>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    </WithDrag>
  )
}
