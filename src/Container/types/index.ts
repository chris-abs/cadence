import { Item } from '@/Item/types'

export interface Container {
  id: number
  name: string
  location: string
  number: number
  qrCode: string
  qrCodeImage: string
  items: Item[]
  createdAt: string
  updatedAt: string
}
