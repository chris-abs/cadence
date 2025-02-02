import { useState } from 'react'
import { toast } from 'sonner'

import { NotAssignedSection } from '@/Global/components/molecules'
import { ItemsListSection } from '@/Global/components/organisms/detail/sections'
import { CreateItemModal } from '@/Item/components/organisms/modal'
import { useUpdateTag } from '@/Tag/queries'
import { UpdateTagData } from '@/Tag/schemas'
import { Tag } from '@/Tag/types'
import { TagSection } from './sections'
import { EntityHeader } from '@/Global/components/molecules/headers'

interface TagDetailProps {
  tag: Tag
}

export function TagDetail({ tag }: TagDetailProps) {
  const updateTag = useUpdateTag()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  const handleUpdateTag = async (data: UpdateTagData) => {
    try {
      await updateTag.mutateAsync(data)
      toast('Tag updated', {
        description: `${data.name || tag.name} has been updated successfully`,
      })
    } catch (err) {
      toast('Error', {
        description: 'Failed to update tag',
        duration: 3000,
      })
      throw err
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <EntityHeader title={tag.name} entityType="item" addEntity="item" onAdd={handleAdd} />

      <TagSection
        tag={tag}
        onUpdate={handleUpdateTag}
        isUpdating={updateTag.isPending}
        emptyStateComponent={<NotAssignedSection title="Tag" message="No tag details available." />}
      />

      <ItemsListSection
        items={tag.items}
        emptyStateComponent={
          <NotAssignedSection
            title="Items"
            message="No items are using this tag yet. Add this tag to items to see them here."
          />
        }
      />

      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}
