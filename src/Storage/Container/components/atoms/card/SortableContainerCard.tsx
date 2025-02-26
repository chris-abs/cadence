import { SortableEntityCard } from '@/Global/components/molecules'
import { Container } from '@/Container/types'
import { ContainerCard } from './ContainerCard'

export function SortableContainerCard({ container }: { container: Container | null }) {
  if (!container) return null
  return (
    <SortableEntityCard entity={container} type="container">
      <ContainerCard container={container} />
    </SortableEntityCard>
  )
}
