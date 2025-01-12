import { Container } from './container'
import { Tag } from './tag'

export interface Item {
  id: number
  name: string
  description: string
  quantity: number
  container_id: number
  container?: Container
  tags: Tag[]
  createdAt: string
  updatedAt: string
}
