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
import { Tag } from '@/Tag/types'
import { useCreateItem } from '@/Item/queries'
import { CreateItemData } from '@/Item/schemas'
import { ItemForm } from '../../molecules/forms'

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  containerId?: number
  tag?: Tag
  onItemCreated?: (itemId: number) => Promise<void>
}

export function CreateItemModal({
  isOpen,
  onClose,
  containerId,
  tag,
  onItemCreated,
}: CreateItemModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const createItem = useCreateItem()

  const handleSubmit = async (data: CreateItemData) => {
    try {
      const itemData = {
        ...data,
        containerId,
        tagNames: tag ? [tag.name] : [],
      }

      const response = await createItem.mutateAsync(itemData)

      if (tag && onItemCreated) {
        await onItemCreated(response.id)
      }

      onClose()

      toast.success('Item created', {
        description: (
          <div className="flex justify-between items-center">
            <span>
              {data.name} has been {tag ? 'created and assigned' : 'created'}
            </span>
            <Button variant="link" onClick={() => navigate({ to: `/items/${response.id}` })}>
              View
            </Button>
          </div>
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create item'))
      toast.error('Failed to create item')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Item</DialogTitle>
          <DialogDescription>
            Add a new item {tag ? `to ${tag.name}` : 'to your collection'}. Only the name is
            required.
          </DialogDescription>
        </DialogHeader>
        <ItemForm
          onSubmit={handleSubmit}
          error={error}
          isLoading={createItem.isPending}
          containerId={containerId}
        />
      </DialogContent>
    </Dialog>
  )
}
