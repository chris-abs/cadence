import { Item } from '@/Item/types'

export interface Tag {
  id: number
  name: string
  items: Item[]
  colour: string
  description: string
  createdAt: string
  updatedAt: string
}

export type SimplifiedTag = Pick<Tag, 'id' | 'name'> & {
  colour?: string
}
