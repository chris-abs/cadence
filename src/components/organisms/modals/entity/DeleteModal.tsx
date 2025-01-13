import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EntityType } from '@/types/collection'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms'
import { deleteCollectionEntity } from '@/queries/collection'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: EntityType
  entityId: number
  entityName: string
}

export function DeleteModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
}: DeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteCollectionEntity(entityType, entityId)
      onClose()

      queryClient.invalidateQueries({ queryKey: ['recent'] })
      queryClient.invalidateQueries({ queryKey: [`${entityType}s`] })

      toast(`${entityType} deleted`, {
        description: (
          <div className="flex justify-between items-center">
            <p>{entityName} has been removed from your collection</p>
            <Link to={`/${entityType}s`}>View {entityType} List</Link>
          </div>
        ),
      })

      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to delete ${entityType}`))
      toast('Error', {
        description: `Failed to delete ${entityType}`,
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
          <DialogTitle>Delete {entityName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete this {entityType}? This action cannot be undone.
          </p>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
