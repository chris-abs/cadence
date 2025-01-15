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
} from '@/entity/Global/components/atoms'
import type { CreateTagData } from '@/schemas/tag'
import { useCreateTag } from '@/queries/tags'
import { TagForm } from '@/entity/Tag/components/molecules/forms/TagForm'

interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTagModal({ isOpen, onClose }: CreateTagModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const createTag = useCreateTag()

  const handleSubmit = async (data: CreateTagData) => {
    try {
      const response = await createTag.mutateAsync(data)
      onClose()

      toast.success('Tag created', {
        description: (
          <div className="flex justify-between items-center">
            <span>{data.name} has been created</span>
            <Button variant="link" onClick={() => navigate({ to: `/tags/${response.id}` })}>
              View
            </Button>
          </div>
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create tag'))
      toast.error('Failed to create tag')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
          <DialogDescription>
            Create a new tag to help organise your items. Both name and color are required.
          </DialogDescription>
        </DialogHeader>
        <TagForm onSubmit={handleSubmit} error={error} isLoading={createTag.isPending} />
      </DialogContent>
    </Dialog>
  )
}
