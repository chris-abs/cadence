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
import { TagForm } from '@/Tag/components/molecules/forms/TagForm'
import { useCreateTag } from '@/Tag/queries'
import { CreateTagData } from '@/Tag/schemas'
import { Item } from '@/Item/types'

interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  item?: Item
  onTagCreated?: (tagId: number) => Promise<void>
}

export function CreateTagModal({ isOpen, onClose, item, onTagCreated }: CreateTagModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const createTag = useCreateTag()

  const handleSubmit = async (data: CreateTagData) => {
    try {
      const response = await createTag.mutateAsync(data)

      if (item && onTagCreated) {
        await onTagCreated(response.id)
      }

      onClose()

      toast.success('Tag created', {
        description: (
          <div className="flex justify-between items-center">
            <span>
              {data.name} has been {item ? 'created and assigned' : 'created'}
            </span>
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
            Create a new tag {item ? `for ${item.name}` : 'to help organise your items'}. Name is
            required.
          </DialogDescription>
        </DialogHeader>
        <TagForm onSubmit={handleSubmit} error={error} isLoading={createTag.isPending} />
      </DialogContent>
    </Dialog>
  )
}
