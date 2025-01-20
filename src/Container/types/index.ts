import { Item } from '@/Item/types'

export interface Container {
  id: number
  name: string
  location: string
  number: number
  qrCode: string
  qrCodeImage: string
  workspaceId?: number
  items: Item[]
  createdAt: string
  updatedAt: string
}
