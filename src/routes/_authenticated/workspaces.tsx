import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'

export const Route = createFileRoute('/_authenticated/workspaces')({
  component: WorkspacesPage,
})

function WorkspacesPage() {
  return (
    <PageLayout>
      <div className="p-4">
        <h1 className="text-xl font-semibold">Workspaces</h1>
      </div>
    </PageLayout>
  )
}
