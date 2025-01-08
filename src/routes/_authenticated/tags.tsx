import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'

export const Route = createFileRoute('/_authenticated/tags')({
  component: TagsPage,
})

function TagsPage() {
  return (
    <PageLayout>
      <div className="p-4">
        <h1 className="text-xl font-semibold">Tags</h1>
      </div>
    </PageLayout>
  )
}
