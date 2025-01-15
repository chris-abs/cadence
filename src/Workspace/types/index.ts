import { Container } from './container'

export interface Workspace {
  id: number
  name: string
  description: string
  containers: Container[]
  createdAt: string
  updatedAt: string
}
