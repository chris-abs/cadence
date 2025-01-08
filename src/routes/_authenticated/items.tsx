import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'

export const Route = createFileRoute('/_authenticated/items')({
  component: ItemsPage,
})

function ItemsPage() {
  return (
    <PageLayout>
      <div className="p-4">
        <h1 className="text-xl font-semibold">Items</h1>
      </div>
    </PageLayout>
  )
}
