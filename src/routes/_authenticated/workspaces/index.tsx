import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { WorkspaceOrganiser } from '@/Workspace/components/organisms/organiser'

export const Route = createFileRoute('/_authenticated/workspaces/')({
  component: WorkspacesPage,
})

function WorkspacesPage() {
  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col min-h-0 p-4">
          <WorkspaceOrganiser />
        </div>
      </div>
    </PageLayout>
  )
}
