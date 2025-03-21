import { useState } from 'react'
import { Settings, Users } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/Global/components/atoms'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'
import { ProfilesSection } from './sections/ProfilesSection'
import { ModulesSection } from './sections/ModulesSection'
import { CreateProfileModal } from '@/Profile/components/organisms/modals'

interface FamilyManagementModalProps {
  isOpen: boolean
  onClose: () => void
  activeTab?: 'members' | 'modules'
  onTabChange?: (tab: 'members' | 'modules') => void
}

export function FamilyManagementModal({
  isOpen,
  onClose,
  activeTab = 'members',
  onTabChange,
}: FamilyManagementModalProps) {
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false)
  const { family } = useProfileWithFamily()

  if (!family) {
    return null
  }

  const handleTabChange = (value: string) => {
    if (value === 'members' || value === 'modules') {
      onTabChange?.(value)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {family.familyName} Family Management
            </DialogTitle>
            <DialogDescription>Manage your family members and settings</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members" className="flex gap-2">
                <Users className="h-4 w-4" />
                <span>Members</span>
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex gap-2">
                <Settings className="h-4 w-4" />
                <span>Modules</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              <ProfilesSection onCreateProfile={() => setIsCreateProfileModalOpen(true)} />
            </TabsContent>

            <TabsContent value="modules" className="mt-4">
              <ModulesSection family={family} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreateProfileModal
        isOpen={isCreateProfileModalOpen}
        onClose={() => setIsCreateProfileModalOpen(false)}
      />
    </>
  )
}
