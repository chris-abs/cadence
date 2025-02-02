import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageLayout } from '@/Global/layout/PageLayout'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { useTags } from '@/Tag/queries'
import { CreateTagModal } from '@/Tag/components/organisms/modals'

export const Route = createFileRoute('/_authenticated/tags/')({
  component: TagsPage,
})

function TagsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: tags, isLoading } = useTags()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 min-h-0 p-4">
          <EntityHeader title="Tags" entityType="tag" addEntity="tag" onAdd={handleAdd} />
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              tags?.map((tag) => (
                <div key={tag.id} className="p-4 border rounded-lg shadow-sm">
                  <h3 className="font-medium">{tag.name}</h3>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
