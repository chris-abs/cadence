import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Box, FolderOpen, Package, Tags } from 'lucide-react'
import { PageLayout } from '@/components/layouts'
import { CreateModal } from '@/components/organisms/modals/Create'
import type { EntityType } from '@/types/collection'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<EntityType>('container')

  const handleCreate = (type: EntityType) => {
    setSelectedType(type)
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
          <div className="flex shrink-0 items-center justify-between p-4">
            <h1 className="text-xl font-semibold">Collections Overview</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleCreate('workspace')}>
                  <Box className="mr-2 h-4 w-4" />
                  New Workspace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate('container')}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  New Container
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate('item')}>
                  <Package className="mr-2 h-4 w-4" />
                  New Item
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate('tag')}>
                  <Tags className="mr-2 h-4 w-4" />
                  New Tag
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid auto-rows-min gap-4 md:grid-cols-2">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
      </div>

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />
    </PageLayout>
  )
}
