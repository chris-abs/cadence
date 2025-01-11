import { Item } from './item'

export interface Tag {
  id: number
  name: string
  items: Item[]
  colour: string
  description: string
  createdAt: string
  updatedAt: string
}
