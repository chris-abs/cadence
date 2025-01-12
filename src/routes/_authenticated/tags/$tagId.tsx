import { PageLayout } from '@/components/layouts'
import { useTag } from '@/queries/tags'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tags/$tagId')({
  component: TagPage,
  loader: ({ params: { tagId } }) => {
    if (!/^\d+$/.test(tagId)) throw new Error('Invalid tag ID')
    return { tagId: parseInt(tagId) }
  },
})

function TagPage() {
  const { tagId } = Route.useParams()
  const { data: tag, isLoading } = useTag(parseInt(tagId))

  if (isLoading) return <div>Loading...</div>
  if (!tag) return <div>Tag not found</div>

  return (
    <PageLayout>
      <h1>{tag.name}</h1>
    </PageLayout>
  )
}
