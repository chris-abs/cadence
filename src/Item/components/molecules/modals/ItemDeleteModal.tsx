import { AlertTriangle } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Global/components/atoms'

interface ImageDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  count: number
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function ImageDeleteModal({
  isOpen,
  onClose,
  count,
  onConfirm,
  isDeleting,
}: ImageDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Selected Images
          </DialogTitle>
        </DialogHeader>
        <div className="py-3">
          <p className="text-sm text-muted-foreground">
            This will permanently delete {count} image{count > 1 ? 's' : ''}. This action cannot be
            undone.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Images'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
