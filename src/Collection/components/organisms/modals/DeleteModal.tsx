import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Global/components/atoms'
import { showEntityActionToast } from '@/Global/components/molecules/EntityActionToast'
import { EntityType } from '@/Collection/types'
import { deleteCollectionEntity } from '@/Collection/queries/collection'

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
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      await deleteCollectionEntity(entityType, entityId)
      onClose()

      queryClient.invalidateQueries({ queryKey: ['recent'] })
      queryClient.invalidateQueries({ queryKey: [`${entityType}s`] })

      showEntityActionToast({
        actionType: 'delete',
        entityType,
        entityName,
        navigate,
      })

      navigate({ to: '/' })
    } catch {
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
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete {entityName}
          </DialogTitle>
        </DialogHeader>
        <div className="py-3">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete{' '}
            <span className="font-medium text-foreground">{entityName}</span>
            {entityType === 'container' && ' and all of its contents'}
            {entityType === 'workspace' && ' and all of its containers'}.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : `Delete ${entityType}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
