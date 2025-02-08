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
  onSelect: (workspaceId: number) => void
  currentWorkspaceId?: number
}

export function WorkspaceSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentWorkspaceId,
}: WorkspaceSelectionModalProps) {
  const { data: workspaces, isLoading } = useWorkspaces()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)

  const handleSelect = () => {
    if (selectedWorkspaceId) {
      onSelect(selectedWorkspaceId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Workspace</DialogTitle>
        </DialogHeader>
        <Select
          onValueChange={(value) => setSelectedWorkspaceId(Number(value))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces?.map((workspace) => (
              <SelectItem
                key={workspace.id}
                value={workspace.id.toString()}
                disabled={workspace.id === currentWorkspaceId}
              >
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedWorkspaceId}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
