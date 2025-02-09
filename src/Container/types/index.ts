import { Item } from '@/Item/types'
import { Workspace } from '@/Workspace/types'

export interface Container {
  id: number
  name: string
  location: string
  number: number
  qrCode: string
  qrCodeImage: string
  workspaceId?: number
  workspace?: Workspace
  items: Item[]
  createdAt: string
  updatedAt: string
}
