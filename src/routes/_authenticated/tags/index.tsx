import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useState } from 'react'
import { useTags } from '@/queries/tags'
import { TagList } from '@/components/molecules/entityList/TagList'
import { CreateTagModal } from '@/components/organisms/modals/entity/detailed/TagModal'

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
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-background border flex-1 rounded-xl">
          <EntityPageHeader title="Tags" entityType="tag" onAdd={handleAdd} />
        </div>
        <div className="bg-background border flex-1 rounded-xl">
          <div className="p-4">
            <TagList tags={tags ?? []} isLoading={isLoading} />
          </div>
        </div>
      </div>

      <CreateTagModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
