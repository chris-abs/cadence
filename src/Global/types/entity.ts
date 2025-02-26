import { EntityType } from '@/Storage/Collection/types'

export interface BaseEntityHeaderProps {
  title: string
  entityType: EntityType
  addEntity?: EntityType
  onAdd?: () => void
  children?: React.ReactNode
}
