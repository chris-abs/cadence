import { Item } from '@/Storage/Item/types'

export interface Tag {
  id: number
  name: string
  items: Item[]
  colour: string
  description: string
  familyId: number
  createdAt: string
  updatedAt: string
}

export type SimplifiedTag = Pick<Tag, 'id' | 'name'> & {
  colour?: string
}
