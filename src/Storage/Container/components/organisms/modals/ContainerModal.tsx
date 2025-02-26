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
import { useCreateContainer } from '@/Storage/Container/queries'
import { CreateContainerData } from '@/Storage/Container/schemas'
import { ContainerForm } from '@/Storage/Container/components/molecules/forms'

interface CreateContainerModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId?: number
}

export function CreateContainerModal({ isOpen, onClose, workspaceId }: CreateContainerModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const createContainer = useCreateContainer()

  const handleSubmit = async (data: CreateContainerData) => {
    try {
      const response = await createContainer.mutateAsync({ ...data, workspaceId })
      onClose()

      toast.success('Container created', {
        description: (
          <div className="flex justify-between items-center">
            <span>{data.name} has been created</span>
            <Button variant="link" onClick={() => navigate({ to: `/containers/${response.id}` })}>
              View
            </Button>
          </div>
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create container'))
      toast.error('Failed to create container')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Container</DialogTitle>
          <DialogDescription>
            Add a new container to organise your items. Only the name is required.
          </DialogDescription>
        </DialogHeader>
        <ContainerForm
          onSubmit={handleSubmit}
          error={error}
          isLoading={createContainer.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
