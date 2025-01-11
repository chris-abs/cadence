import { PageLayout } from '@/components/layouts'
import { useItem } from '@/queries/item'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/items/$itemId')({
  component: ItemPage,
  loader: ({ params: { itemId } }) => {
    if (!/^\d+$/.test(itemId)) throw new Error('Invalid item ID')
    return { itemId: parseInt(itemId) }
  },
})

function ItemPage() {
  const { itemId } = Route.useParams()
  const { data: item, isLoading } = useItem(parseInt(itemId))

  if (isLoading) return <div>Loading...</div>
  if (!item) return <div>Item not found</div>

  return (
    <PageLayout>
      <h1>{item.name}</h1>
    </PageLayout>
  )
}
