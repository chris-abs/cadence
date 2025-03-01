import { FamilyRoles } from '@/Family/types'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  imageUrl: string
  createdAt: string
  updatedAt: string
  familyId?: number
  role?: FamilyRoles['role']
}

export interface UserResponse {
  user: User
  token: string
  familyId?: number
  role?: FamilyRoles['role']
}

export interface UpdateUserData {
  id: number
  firstName?: string
  lastName?: string
  image?: File
}
