import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EntityType } from '@/types/collection'
import { CreateEntityForm } from '@/components/molecules/forms/entity/CreateEntityForm'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms'
import { createCollectionEntity } from '@/queries/colletion'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  selectedType: EntityType
  onTypeChange: (type: EntityType) => void
}

export function CreateModal({ isOpen, onClose, selectedType, onTypeChange }: CreateModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleSubmit = async (data: { name: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await createCollectionEntity(selectedType, data)
      onClose()

      queryClient.invalidateQueries({ queryKey: ['recent'] })

      toast(`New ${selectedType} created`, {
        description: (
          <div className="flex justify-between items-center">
            <span>{data.name} has been added to your collection</span>
            <Button
              variant="link"
              onClick={() => navigate({ to: `/${selectedType}s/${response.id}` })}
            >
              Edit
            </Button>
          </div>
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create entity'))
      toast('Error', {
        description: `Failed to create ${selectedType}`,
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New {selectedType}</DialogTitle>
        </DialogHeader>
        <CreateEntityForm
          selectedType={selectedType}
          onTypeChange={onTypeChange}
          onSubmit={handleSubmit}
          error={error}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
