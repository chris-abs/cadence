import { Section } from '@/Global/components/molecules'
import { ContainerList } from '@/Container/components/molecules/catalogue/ContainerCatalogue'
import { Container } from '@/Container/types'

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
    <Section>
      <div className="space-y-4">
        <header className="flex justify-between items-center">
          <h2 id="containers-list-section-title" className="text-lg font-medium">
            Containers in Workspace
          </h2>
        </header>
        <ContainerList containers={containers} isLoading={false} />
      </div>
    </Section>
  )
}
