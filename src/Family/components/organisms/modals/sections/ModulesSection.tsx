import { Settings } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/Global/components/atoms'
import { Family, ModuleID } from '@/Family/types'
import { moduleDefinitions } from '@/Family/constants'
import { useUpdateModule } from '@/Family/queries'
import { toast } from 'sonner'

interface ModulesSectionProps {
  family: Family
}

export function ModulesSection({ family }: ModulesSectionProps) {
  const updateModule = useUpdateModule()

  const handleModuleToggle = (moduleId: ModuleID, isEnabled: boolean) => {
    updateModule.mutate(
      {
        moduleId,
        isEnabled: !isEnabled,
      },
      {
        onSuccess: () => {
          if (!isEnabled) {
            toast.success(`${moduleDefinitions[moduleId].name} enabled`, {
              description: 'Module has been activated for your family',
            })
          } else {
            toast.info(`${moduleDefinitions[moduleId].name} disabled`, {
              description: 'Module has been deactivated for your family',
            })
          }
        },
        onError: (error) => {
          toast.error(`Failed to update ${moduleDefinitions[moduleId].name}`, {
            description: error instanceof Error ? error.message : 'Please try again',
          })
        },
      },
    )
  }

  const moduleMap = new Map(family.modules.map((module) => [module.id, module]))
  const allModuleIds = Object.keys(moduleDefinitions) as ModuleID[]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Module Subscriptions
          </CardTitle>
          <CardDescription>Enable or disable modules for your family</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allModuleIds.map((moduleId) => {
            const moduleInfo = moduleDefinitions[moduleId]
            if (!moduleInfo || !moduleInfo.isAvailable) return null

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
                  onCheckedChange={() => handleModuleToggle(moduleId, module.isEnabled)}
                  disabled={updateModule.isPending}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
