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
import type { CreateItemData } from '@/schemas/item'
import { useCreateItem } from '@/queries/item'
import { ItemForm } from '@/entity/Item/components/molecules/forms/ItemForm'

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  containerId?: number
}

export function CreateItemModal({ isOpen, onClose, containerId }: CreateItemModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const createItem = useCreateItem()

  const handleSubmit = async (data: CreateItemData) => {
    try {
      const response = await createItem.mutateAsync(data)
      onClose()

      toast.success('Item created', {
        description: (
          <div className="flex justify-between items-center">
            <span>{data.name} has been created</span>
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
            Add a new item to your collection. Only the name is required.
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
