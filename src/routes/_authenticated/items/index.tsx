import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { EntityPageHeader } from '@/Global/components/molecules'
import { PageLayout } from '@/Global/layout/PageLayout'
import { ItemList } from '@/Item/components/molecules/catalogue/ItemCatalogue'
import { CreateItemModal } from '@/Item/components/organisms/ItemModal'
import { useItems } from '@/Item/queries'

export const Route = createFileRoute('/_authenticated/items/')({
  component: ItemsPage,
})

function ItemsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: items } = useItems()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <div className="bg-background border rounded-xl">
            <EntityPageHeader title="Items" entityType="item" onAdd={handleAdd} />
          </div>
          <div className="bg-background border rounded-xl flex flex-1 flex-col min-h-0">
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <ItemList items={items ?? []} />
            </div>
          </div>
        </div>
      </div>
      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
