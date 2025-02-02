import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageLayout } from '@/Global/layout/PageLayout'
import { SearchEntityHeader } from '@/Global/components/molecules/headers'
import { useItems } from '@/Item/queries'
import { CreateItemModal } from '@/Item/components/organisms/modal'

export const Route = createFileRoute('/_authenticated/items/')({
  component: ItemsPage,
})

function ItemsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: items, isLoading } = useItems()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 min-h-0 p-4">
          <SearchEntityHeader
            title="Items"
            entityType="item"
            addEntity="item"
            onAdd={handleAdd}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
          />
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              items?.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg shadow-sm">
                  <h3 className="font-medium">{item.name}</h3>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
