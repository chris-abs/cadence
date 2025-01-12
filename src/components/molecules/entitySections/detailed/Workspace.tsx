import { Input, Label } from '@/components/atoms'
import { Workspace } from '@/types'

interface WorkspaceSectionProps {
  workspace: Workspace | null
  emptyStateComponent?: React.ReactNode
}

export function WorkspaceSection({ workspace, emptyStateComponent }: WorkspaceSectionProps) {
  if (!workspace?.name) {
    return emptyStateComponent || null
  }

  return (
    <section
      className="bg-background border rounded-xl p-4"
      aria-labelledby="workspace-section-title"
    >
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="workspace-section-title" className="text-lg font-medium">
            Workspace Details
          </h2>
        </header>

        <form className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              value={workspace.name}
              readOnly
              aria-label="Workspace name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Input
              id="workspace-description"
              value={workspace.description || ''}
              readOnly
              aria-label="Workspace description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-created">Created</Label>
            <Input
              id="workspace-created"
              value={new Date(workspace.createdAt).toLocaleDateString()}
              readOnly
              aria-label="Workspace creation date"
            />
          </div>
        </form>
      </div>
    </section>
  )
}
