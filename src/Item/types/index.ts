import { Container } from '@/Container/types'
import { Tag } from '@/Tag/types'

// TODO: add array of images for items
export interface ItemImage {
  id: number
  url: string
  createdAt: string
}

export interface Item {
  id: number
  name: string
  description: string
  quantity: number
  imgUrl: string
  container_id: number
  container?: Container
  tags: Tag[]
  createdAt: string
  updatedAt: string
}
