import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { EntityPageHeader, Section } from '@/Global/components/molecules'
import { TagOrganiser } from '@/Tag/components/molecules/organiser/TagOrganiser'
import { CreateTagModal } from '@/Tag/components/organisms/TagModal'
import { useTags } from '@/Tag/queries'

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
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <EntityPageHeader title="Tags" entityType="tag" onAdd={handleAdd} />
          <Section className="flex-1">
            <TagOrganiser tags={tags ?? []} isLoading={isLoading} />
          </Section>
        </div>
      </div>
      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
