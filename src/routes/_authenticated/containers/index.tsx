import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageLayout } from '@/Global/layout/PageLayout'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { useContainers } from '@/Container/queries'

export const Route = createFileRoute('/_authenticated/containers/')({
  component: ContainersPage,
})

function ContainersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: containers, isLoading } = useContainers()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 min-h-0 p-4">
          <EntityHeader title="Containers" entityType="container" onAdd={handleAdd} />
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              containers?.map((container) => (
                <div key={container.id} className="p-4 border rounded-lg shadow-sm">
                  <h3 className="font-medium">{container.name}</h3>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
