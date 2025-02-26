import { createFileRoute, Link } from '@tanstack/react-router'
import { Tags } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { TagDetail } from '@/Storage/Tag/components/organisms/detail'
import { useTag } from '@/Storage/Tag/queries'

export const Route = createFileRoute('/_authenticated/tags/$tagId')({
  component: TagPage,
})

function TagPage() {
  const { tagId } = Route.useParams()
  const parsedTagId = parseInt(tagId)
  const { data: tag } = useTag(parsedTagId)

  if (!tag) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <Tags className="h-4 w-4" />
            <AlertTitle>No Tags have been found...</AlertTitle>
            <AlertDescription>
              You can create tags in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and add them to Items for better organising!
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <TagDetail tag={tag} />
      </div>
    </PageLayout>
  )
}
