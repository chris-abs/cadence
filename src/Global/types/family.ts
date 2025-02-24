// /Global/types/family.ts
export interface Module {
  id: string
  isEnabled: boolean
}

export interface Family {
  id: number
  name: string
  ownerId: number
  status: 'ACTIVE' | 'INACTIVE'
  modules: Module[]
  createdAt: string
  updatedAt: string
}

export interface CreateFamilyRequest {
  name: string
  modules?: string[]
}

export interface FamilyRoles {
  role: 'PARENT' | 'CHILD'
}

export interface FamilyInvite {
  id: number
  familyId: number
  email: string
  role: 'PARENT' | 'CHILD'
  token: string
  expiresAt: string
}

export interface CreateInviteRequest {
  email: string
  role: FamilyRoles
}

export interface JoinFamilyRequest {
  token: string
}
