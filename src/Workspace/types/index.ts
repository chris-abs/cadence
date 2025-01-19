import { Container } from '@/Container/types'

export interface Workspace {
  id: number
  name: string
  description: string
  containers?: Container[]
  createdAt: string
  updatedAt: string
}
