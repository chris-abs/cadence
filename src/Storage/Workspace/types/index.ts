import { Container } from '@/Container/types'

export interface Workspace {
  id: number
  name: string
  description: string
  containers: Container[]
  familyId: number
  createdAt: string
  updatedAt: string
}
