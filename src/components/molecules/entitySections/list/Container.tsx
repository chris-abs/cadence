import { ContainerList } from '@/components/molecules/entityList/ContainerList'
import { Container } from '@/types'

interface ContainersListSectionProps {
  containers: Container[]
  emptyStateComponent?: React.ReactNode
}

export function ContainersListSection({
  containers,
  emptyStateComponent,
}: ContainersListSectionProps) {
  if (!containers?.length) {
    return emptyStateComponent || null
  }

  return (
    <section
      className="bg-background border rounded-xl p-4"
      aria-labelledby="containers-list-section-title"
    >
      <div className="space-y-4">
        <header className="flex justify-between items-center">
          <h2 id="containers-list-section-title" className="text-lg font-medium">
            Containers in Workspace
          </h2>
        </header>
        <ContainerList containers={containers} isLoading={false} />
      </div>
    </section>
  )
}
