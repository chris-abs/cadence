import { useRouter } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Button, Switch } from '@/Global/components/atoms'
import { useUserWithFamily } from '@/User/hooks/useUserWithFamily'
import { useUpdateModule } from '@/Global/queries/family'
import { ModuleID } from '@/Global/types/family'
import {
  PackageIcon,
  UtensilsIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  ExternalLinkIcon,
} from 'lucide-react'

const moduleDetails = {
  storage: {
    name: 'Storage',
    description: 'Organize containers, items, and manage storage spaces',
    icon: PackageIcon,
  },
  meals: {
    name: 'Meals',
    description: 'Plan meals, create shopping lists, and track ingredients',
    icon: UtensilsIcon,
  },
  chores: {
    name: 'Chores',
    description: 'Assign and track household chores and responsibilities',
    icon: ClipboardCheckIcon,
  },
  services: {
    name: 'Services',
    description: 'Track subscriptions, bills, and recurring payments',
    icon: CreditCardIcon,
  },
}

export function ModuleGrid() {
  const router = useRouter()
  const { family, isParent } = useUserWithFamily()
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
      {family.modules.map((module) => {
        const ModuleIcon = moduleDetails[module.id]?.icon || PackageIcon
        const details = moduleDetails[module.id as keyof typeof moduleDetails]

        return (
          <Card key={module.id} className={!module.isEnabled ? 'opacity-70' : undefined}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <ModuleIcon className="h-6 w-6 text-primary" />
                <CardTitle>{details.name}</CardTitle>
              </div>
              {isParent && (
                <Switch
                  checked={module.isEnabled}
                  onCheckedChange={() => handleToggleModule(module.id, module.isEnabled)}
                  aria-label={`Enable ${details.name}`}
                />
              )}
            </CardHeader>
            <CardContent>
              <CardDescription>{details.description}</CardDescription>
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
