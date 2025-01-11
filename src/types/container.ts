import { Item } from './item'

export interface Container {
  id: number
  name: string
  location: string
  items: Item[]
  description: string
  createdAt: string
  updatedAt: string
}
