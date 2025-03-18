import { useRouter } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Button, Switch } from '@/Global/components/atoms'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'
import { useUpdateModule } from '@/Family/queries'
import { moduleDefinitions } from '@/Family/constants'
import { Module, ModuleID } from '@/Family/types'

function isValidModuleId(id: string): id is ModuleID {
  return Object.keys(moduleDefinitions).includes(id)
}

export function ModuleGrid() {
  const router = useRouter()
  const { family, isParent } = useProfileWithFamily()
  const updateModule = useUpdateModule()

  if (!family) {
    return null
  }

  const handleToggleModule = (moduleId: ModuleID, currentStatus: boolean) => {
    updateModule.mutate({
      familyId: family.id,
      moduleId,
      isEnabled: !currentStatus,
    })
  }

  const handleNavigateToModule = (moduleId: ModuleID) => {
    router.navigate({ to: `/cadence/${moduleId}` })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {family.modules.map((module: Module) => {
        if (!isValidModuleId(module.id)) {
          return null
        }

        const moduleInfo = moduleDefinitions[module.id]
        const ModuleIcon = moduleInfo.icon

        return (
          <Card key={module.id} className={!module.isEnabled ? 'opacity-70' : undefined}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <ModuleIcon className="h-6 w-6 text-primary" />
                <CardTitle>{moduleInfo.name}</CardTitle>
              </div>
              {isParent && (
                <Switch
                  checked={module.isEnabled}
                  onCheckedChange={() => handleToggleModule(module.id, module.isEnabled)}
                  aria-label={`Enable ${moduleInfo.name}`}
                />
              )}
            </CardHeader>
            <CardContent>
              <CardDescription>{moduleInfo.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button
                disabled={!module.isEnabled}
                variant={module.isEnabled ? 'default' : 'outline'}
                onClick={() => module.isEnabled && handleNavigateToModule(module.id)}
                className="flex items-center gap-2"
              >
                {module.isEnabled ? (
                  <>
                    Open <ExternalLinkIcon className="h-4 w-4" />
                  </>
                ) : (
                  'Module Disabled'
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
