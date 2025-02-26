import { createFileRoute, Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { ItemDetail } from '@/Storage/Item/components/organisms/detail'
import { useItem } from '@/Storage/Item/queries'

export const Route = createFileRoute('/_authenticated/items/$itemId')({
  component: ItemPage,
})

function ItemPage() {
  const { itemId } = Route.useParams()
  const parsedItemId = parseInt(itemId)
  const { data: item, isLoading } = useItem(parsedItemId)

  if (isLoading) {
    return <PageLayout>Loading...</PageLayout>
  }

  if (!item) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>No Items have been found...</AlertTitle>
            <AlertDescription>
              You can create Items in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and store them in Containers for better organising!
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ItemDetail item={item} />
      </div>
    </PageLayout>
  )
}
