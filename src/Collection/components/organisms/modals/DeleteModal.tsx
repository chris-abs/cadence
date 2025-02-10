import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Global/components/atoms'
import { showEntityActionToast } from '@/Global/components/molecules/EntityActionToast'
import { queryKeys } from '@/Global/lib/queryKeys'
import { EntityType } from '@/Collection/types'
import { deleteCollectionEntity } from '@/Collection/queries/collection'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: EntityType
  entityId: number
  entityName: string
}

const getEntityDescription = (entityType: EntityType, entityName: string): string => {
  const descriptions: Record<EntityType, string> = {
    workspace: `This will permanently delete ${entityName} and remove the association with all its containers`,
    container: `This will permanently delete ${entityName} and remove the association with all its items`,
    item: `This will permanently delete ${entityName} and remove it from all associated tags.`,
    tag: `This will permanently delete ${entityName} and remove it from all associated items.`,
  }
  return descriptions[entityType]
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

      queryClient.removeQueries({
        queryKey: queryKeys[`${entityType}s`].detail(entityId),
        exact: true,
      })

      if (entityType === 'workspace') {
        queryClient.refetchQueries({
          queryKey: queryKeys.containers.list,
          exact: true,
        })
      } else if (entityType === 'container') {
        queryClient.refetchQueries({
          queryKey: queryKeys.items.list,
          exact: true,
        })
      } else if (entityType === 'tag' || entityType === 'item') {
        queryClient.refetchQueries({
          queryKey: queryKeys.items.list,
          exact: true,
        })
        queryClient.refetchQueries({
          queryKey: queryKeys.tags.list,
          exact: true,
        })
      }

      queryClient.refetchQueries({
        queryKey: queryKeys[`${entityType}s`].list,
        exact: true,
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.recent,
        exact: true,
      })

      onClose()
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
            This action cannot be undone. {getEntityDescription(entityType, entityName)}
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
