import { Button } from '@/Global/components/atoms'
import { toast } from 'sonner'
import type { NavigateOptions } from '@tanstack/react-router'

import { capitalise } from '@/Global/utils/capitalise'
import { EntityType } from '@/Collection/types'

interface EntityActionToastProps {
  actionType: 'create' | 'delete'
  entityType: EntityType
  entityName: string
  entityId?: number
  navigate: (opts: NavigateOptions) => void
}

export function showEntityActionToast({
  actionType,
  entityType,
  entityName,
  entityId,
  navigate,
}: EntityActionToastProps) {
  const actions = {
    create: {
      title: `New ${capitalise(entityType)} Created`,
      message: `${entityName} has been added to your collection`,
      action: {
        text: 'View details',
        path: `/${entityType}s/${entityId}`,
      },
    },
    delete: {
      title: `${capitalise(entityType)} Deleted`,
      message: `${entityName} has been removed from your collection`,
      action: {
        text: `View ${entityType} list`,
        path: `/${entityType}s`,
      },
    },
  }

  const { title, message, action } = actions[actionType]

  return toast(title, {
    description: (
      <div className="flex flex-col gap-2">
        <span>{message}</span>
        <div className="flex justify-end">
          <Button
            variant="link"
            className="px-0 h-auto font-normal hover:no-underline"
            onClick={() => navigate({ to: action.path as NavigateOptions['to'] })}
          >
            {action.text} →
          </Button>
        </div>
      </div>
    ),
  })
}
