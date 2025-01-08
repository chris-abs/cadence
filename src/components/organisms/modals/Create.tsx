import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Box, FolderOpen, Package, Tags } from 'lucide-react'
import { EntityType } from '@/types/collection'
import { createCollectionEntity } from '@/queries/colletion'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/components/atoms'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
}

const typeDetails = {
  workspace: {
    icon: Box,
    title: 'Create Workspace',
    namePlaceholder: 'Workspace name',
  },
  container: {
    icon: FolderOpen,
    title: 'Create Container',
    namePlaceholder: 'Container name',
  },
  item: {
    icon: Package,
    title: 'Create Item',
    namePlaceholder: 'Item name',
  },
  tag: {
    icon: Tags,
    title: 'Create Tag',
    namePlaceholder: 'Tag name',
  },
} as const

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const [selectedType, setSelectedType] = useState<EntityType>('container')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await createCollectionEntity(selectedType, { name })

      onClose()
      setName('')

      toast(`New ${selectedType} created`, {
        description: (
          <div className="flex justify-between items-center">
            <span>{name} has been added to your collection</span>
            <Button
              variant="link"
              onClick={() => navigate({ to: `/${selectedType}s/${response.id}` })}
            >
              Edit
            </Button>
          </div>
        ),
      })
    } catch {
      toast('Error', {
        description: `Failed to create ${selectedType}`,
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const { icon: Icon, title, namePlaceholder } = typeDetails[selectedType]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              {(Object.keys(typeDetails) as EntityType[]).map((type) => {
                const { icon: TypeIcon } = typeDetails[type]
                return (
                  <Button
                    key={type}
                    type="button"
                    variant={selectedType === type ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type)}
                    className="flex-1"
                  >
                    <TypeIcon className="mr-2 h-4 w-4" />
                    {type}
                  </Button>
                )
              })}
            </div>
            <Input
              placeholder={namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
