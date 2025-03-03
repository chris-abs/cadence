export type ModuleID = 'storage' | 'chores' | 'meals' | 'services'
export type FamilyStatus = 'ACTIVE' | 'INACTIVE'

export interface FamilyRoles {
  role: 'PARENT' | 'CHILD'
}

export interface Module {
  id: ModuleID
  isEnabled: boolean
}

export interface Family {
  id: number
  name: string
  ownerId: number
  status: FamilyStatus
  modules: Module[]
  createdAt: string
  updatedAt: string
}

export interface CreateFamilyRequest {
  name: string
  modules?: ModuleID[]
}

export interface FamilyInvite {
  id: number
  familyId: number
  email: string
  role: FamilyRoles['role']
  token: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateInviteRequest {
  email: string
  role: FamilyRoles['role']
}

export interface UpdateFamilyRequest {
  name: string
  status: FamilyStatus
}

export interface JoinFamilyRequest {
  token: string
}
