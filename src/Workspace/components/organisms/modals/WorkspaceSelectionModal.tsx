import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Global/components/atoms'
import { useWorkspaces } from '@/Workspace/queries'

interface WorkspaceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (workspaceId: number | undefined) => void // Changed to allow undefined
  currentWorkspaceId?: number
}

export function WorkspaceSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentWorkspaceId,
}: WorkspaceSelectionModalProps) {
  const { data: workspaces, isLoading } = useWorkspaces()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | undefined>(
    currentWorkspaceId,
  )

  const handleSelect = () => {
    onSelect(selectedWorkspaceId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Workspace</DialogTitle>
        </DialogHeader>
        <Select
          onValueChange={(value) =>
            setSelectedWorkspaceId(value === 'none' ? undefined : Number(value))
          }
          disabled={isLoading}
          defaultValue={currentWorkspaceId?.toString() || 'none'}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a workspace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Workspace</SelectItem>
            {workspaces?.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id.toString()}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={selectedWorkspaceId === currentWorkspaceId}>
            {selectedWorkspaceId === undefined ? 'Remove' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
