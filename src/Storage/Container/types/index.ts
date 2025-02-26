import { Item } from '@/Item/types'
import { Workspace } from '@/Workspace/types'

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
