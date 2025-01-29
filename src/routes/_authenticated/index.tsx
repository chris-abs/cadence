import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/Global/layout/PageLayout'
import { CreateModal } from 'src/Collection/components/organisms/modals'
import { EntityType } from '@/Global/types'
import { CollectionOrganizer } from '@/Collection/components/organisms/CollectionOrganizer'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<EntityType>('container')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreate = (type: EntityType) => {
    setSelectedType(type)
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <CollectionOrganizer
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateEntity={handleCreate}
        />
      </div>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />
    </PageLayout>
  )
}
