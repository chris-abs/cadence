import { FamilyRoles } from '@/Family/types'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  imageUrl: string
  role?: FamilyRoles['role']
  familyId?: number
  createdAt: string
  updatedAt: string
}

export interface UserResponse {
  user: User
  token: string
}

export interface UpdateUserData {
  id: number
  firstName?: string
  lastName?: string
  image?: File
}
