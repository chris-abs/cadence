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
  email: string
  familyName: string
  createdAt: string
  updatedAt: string
  modules: Module[]
  status: FamilyStatus
}

export interface CreateFamilyRequest {
  name: string
  modules?: ModuleID[]
}

export interface UpdateFamilyData {
  familyName: string
  status?: FamilyStatus
}

export interface UpdateModuleRequest {
  moduleId: ModuleID
  isEnabled: boolean
}
