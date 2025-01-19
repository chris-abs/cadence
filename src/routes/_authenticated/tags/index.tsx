import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { EntityPageHeader, Section } from '@/Global/components/molecules'
import { TagList } from '@/Tag/components/molecules/catalogue/TagCatalogue'
import { CreateTagModal } from '@/Tag/components/organisms/TagModal'
import { useTags } from '@/Tag/queries'
import {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Large,
  Lead,
  Muted,
  P,
  Small,
} from '@/Global/components/molecules/Typography'

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
            <TagList tags={tags ?? []} isLoading={isLoading} />
          </Section>
        </div>
      </div>
      {/* TODO: Remove post refactor */}
      <div className="flex flex-1 flex-col gap-3">
        <H1>H1</H1>
        <H2>H2</H2>
        <H3>H3</H3>
        <H4>H4</H4>
        <H5>H5</H5>
        <H6>H6</H6>
        <P>P</P>
        <Muted>Muted</Muted>
        <Lead>Lead</Lead>
        <Large>Large</Large>
        <Small>Small</Small>
      </div>
      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
