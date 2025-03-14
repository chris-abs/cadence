import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Settings, Home } from 'lucide-react'

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/Global/components/atoms'
import { useUserWithFamily } from '@/User/hooks/useUserWithFamily'
import { useCreateInvite, useUpdateModule } from '@/Family/queries'
import { CreateFamilyInviteForm } from '../../molecules/forms'
import { moduleDefinitions } from '@/Family/constants'
import { Family, ModuleID } from '@/Family/types'
import { CreateFamilyInviteData } from '@/Family/schemas'

interface ManageFamilyModalProps {
  isOpen: boolean
  onClose: () => void
  activeTab: 'members' | 'modules'
  onTabChange: (tab: 'members' | 'modules') => void
}

export function ManageFamilyModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: ManageFamilyModalProps) {
  const { family, isParent } = useUserWithFamily()

  if (!family || !isParent) {
    return null
  }

  const handleTabChange = (value: string) => {
    if (value === 'members' || value === 'modules') {
      onTabChange(value)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {family.name} Family Settings
          </DialogTitle>
          <DialogDescription>Manage your family members and module subscriptions</DialogDescription>
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
            <FamilyMembersTab family={family} />
          </TabsContent>

          <TabsContent value="modules" className="mt-4">
            <ModulesTab family={family} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

interface FamilyMembersTabProps {
  family: Family
}

function FamilyMembersTab({ family }: FamilyMembersTabProps) {
  const [formError, setFormError] = useState<Error | null>(null)
  const createInvite = useCreateInvite()

  const handleInvite = async (data: CreateFamilyInviteData) => {
    try {
      setFormError(null)
      const response = await createInvite.mutateAsync({
        familyId: family.id,
        data,
      })

      navigator.clipboard.writeText(response.token)

      toast.success('Invitation created', {
        description: `An invitation has been sent to ${data.email}. The token has been copied to your clipboard.`,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err : new Error('Failed to create invitation'))
      toast.error('Failed to create invitation')
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite New Members</CardTitle>
          <CardDescription>Send an invitation to add someone to your family</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateFamilyInviteForm
            onSubmit={handleInvite}
            error={formError}
            isLoading={createInvite.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
          <CardDescription>Manage existing family members (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This feature will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface ModulesTabProps {
  family: Family
}

function ModulesTab({ family }: ModulesTabProps) {
  const updateModule = useUpdateModule()

  const handleToggleModule = (moduleId: ModuleID, currentEnabled: boolean) => {
    updateModule.mutate({
      familyId: family.id,
      moduleId,
      isEnabled: !currentEnabled,
    })
  }

  const allModuleIds = Object.keys(moduleDefinitions) as ModuleID[]

  const moduleMap = new Map(family.modules.map((module) => [module.id, module]))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Module Subscriptions</CardTitle>
          <CardDescription>Enable or disable modules for your family</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allModuleIds.map((moduleId) => {
              const moduleInfo = moduleDefinitions[moduleId]
              if (!moduleInfo) return null

              const module = moduleMap.get(moduleId) || { id: moduleId, isEnabled: false }
              const ModuleIcon = moduleInfo.icon

              return (
                <div
                  key={moduleId}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${module.isEnabled ? 'bg-primary/10' : 'bg-muted'}`}
                    >
                      <ModuleIcon
                        className={`h-5 w-5 ${module.isEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{moduleInfo.name}</h3>
                      <p className="text-sm text-muted-foreground">{moduleInfo.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={module.isEnabled}
                    onCheckedChange={() => handleToggleModule(moduleId, module.isEnabled)}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
