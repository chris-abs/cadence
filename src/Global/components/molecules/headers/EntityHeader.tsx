import { Plus } from 'lucide-react'

import { Button } from '@/Global/components/atoms'
import { H1 } from '../Typography'
import { BaseEntityHeaderProps } from '@/Global/types/entity'

export function EntityHeader({ title, addEntity, onAdd, children }: BaseEntityHeaderProps) {
  return (
    <section className="bg-background border rounded-xl px-4 py-2 md:px-6">
      <div className="flex shrink-0 items-center justify-between">
        <H1>{title}</H1>
        <div className="flex items-center gap-2">
          {addEntity && onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              New {addEntity}
            </Button>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}
