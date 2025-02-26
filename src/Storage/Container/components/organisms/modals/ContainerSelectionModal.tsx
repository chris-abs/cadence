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
import { useContainers } from '@/Storage/Container/queries'

interface ContainerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (containerId: number) => void
  currentContainerId?: number
}

export function ContainerSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentContainerId,
}: ContainerSelectionModalProps) {
  const { data: containers, isLoading } = useContainers()
  const [selectedContainerId, setSelectedContainerId] = useState<number | null>(
    currentContainerId || null,
  )

  const handleSelect = () => {
    if (selectedContainerId) {
      onSelect(selectedContainerId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Container</DialogTitle>
        </DialogHeader>
        <Select
          onValueChange={(value) => setSelectedContainerId(Number(value))}
          disabled={isLoading}
          defaultValue={currentContainerId?.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a container" />
          </SelectTrigger>
          <SelectContent>
            {containers?.map((container) => (
              <SelectItem
                key={container.id}
                value={container.id.toString()}
                disabled={container.id === currentContainerId}
              >
                {container.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedContainerId}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
