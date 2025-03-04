import { PackageOpen } from 'lucide-react'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { Family, ModuleID } from '@/Family/types'
import { moduleDefinitions } from '@/Family/constants'
import { useUpdateModule, useFamilyModules } from '@/Family/queries'

interface FamilyModulesSectionProps {
  family: Family
  isParent: boolean
}

export function FamilyModulesSection({ family, isParent }: FamilyModulesSectionProps) {
  const { data: modules } = useFamilyModules(family.id)
  const updateModule = useUpdateModule()

  const displayModules = modules || family.modules

  const handleModuleToggle = (moduleId: ModuleID, isEnabled: boolean) => {
    updateModule.mutate(
      {
        familyId: family.id,
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

  return (
    <Section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5" />
            Active Modules
          </CardTitle>
          <CardDescription>Manage which modules are enabled for your family</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayModules.map((module) => {
            if (!moduleDefinitions[module.id]) return null

            const ModuleIcon = moduleDefinitions[module.id].icon

            return (
              <div key={module.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ModuleIcon className="h-5 w-5 text-primary" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">{moduleDefinitions[module.id].name}</span>
                    <p className="text-sm text-muted-foreground">
                      {moduleDefinitions[module.id].description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={module.isEnabled}
                  onCheckedChange={() => handleModuleToggle(module.id, module.isEnabled)}
                  disabled={!isParent || updateModule.isPending}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </Section>
  )
}
