import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'

export const Route = createFileRoute('/_authenticated/containers')({
  component: ContainersPage,
})

function ContainersPage() {
  return (
    <PageLayout>
      <div className="p-4">
        <h1 className="text-xl font-semibold">Containers</h1>
      </div>
    </PageLayout>
  )
}
