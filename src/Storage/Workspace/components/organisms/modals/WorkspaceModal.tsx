import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@/Global/components/atoms'
import { useCreateWorkspace } from '@/Storage/Workspace/queries'
import { CreateWorkspaceData } from '@/Storage/Workspace/schemas'
import { WorkspaceForm } from '@/Storage/Workspace/components/molecules/forms'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const createWorkspace = useCreateWorkspace()

  const handleSubmit = async (data: CreateWorkspaceData) => {
    try {
      const response = await createWorkspace.mutateAsync(data)
      onClose()

      toast.success('Workspace created', {
        description: (
          <div className="flex justify-between items-center">
            <span>{data.name} has been created</span>
            <Button variant="link" onClick={() => navigate({ to: `/workspaces/${response.id}` })}>
              View
            </Button>
          </div>
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create workspace'))
      toast.error('Failed to create workspace')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organise your containers and items. Only the name is required.
          </DialogDescription>
        </DialogHeader>
        <WorkspaceForm
          onSubmit={handleSubmit}
          error={error}
          isLoading={createWorkspace.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
