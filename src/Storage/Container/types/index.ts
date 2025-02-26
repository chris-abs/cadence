import { Item } from '@/Storage/Item/types'
import { Workspace } from '@/Storage/Workspace/types'

export interface Container {
  id: number
  name: string
  description?: string
  location: string
  number: number
  qrCode: string
  qrCodeImage: string
  workspaceId?: number
  workspace?: Workspace
  familyId: number
  items: Item[]
  createdAt: string
  updatedAt: string
}
