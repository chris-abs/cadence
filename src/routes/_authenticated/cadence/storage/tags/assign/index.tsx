import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { SearchEntityHeader } from '@/Global/components/molecules/headers'
import { PageLayout } from '@/Global/layout/PageLayout'
import { useTags } from '@/Storage/Tag/queries'
import { TagOrganiser } from '@/Storage/Tag/components/organisms/organiser/TagOrganiser'
import { CreateTagModal } from '@/Storage/Tag/components/organisms/modals'

export const Route = createFileRoute('/_authenticated/cadence/storage/tags/assign/')({
  component: TagsPage,
})

function TagsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: tags, isLoading } = useTags()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <SearchEntityHeader
            title="Tags"
            entityType="tag"
            addEntity="item"
            onAdd={handleAdd}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
          />
          <TagOrganiser tags={tags ?? []} isLoading={isLoading} searchQuery={searchQuery} />
        </div>
      </div>
      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
