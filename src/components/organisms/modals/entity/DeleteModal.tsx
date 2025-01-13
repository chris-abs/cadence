import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EntityType } from '@/types/collection'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms'
import { deleteCollectionEntity } from '@/queries/collection'
import { AlertTriangle } from 'lucide-react'

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
          <div className="flex flex-col gap-2">
            <span>{entityName} has been removed from your collection</span>
            <div className="flex justify-end">
              <Button
                variant="link"
                className="px-0 h-auto font-normal"
                onClick={() => navigate({ to: `/${entityType}s` })}
              >
                View {entityType} List →
              </Button>
            </div>
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
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete {entityName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="font-medium">Are you sure you want to delete this {entityType}?</p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-medium text-foreground">{entityName}</span>
              {entityType === 'container' && ' and all of its contents'}
              {entityType === 'workspace' && ' and all of its containers'}.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error.message}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? <>Deleting...</> : <>Delete {entityType}</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
