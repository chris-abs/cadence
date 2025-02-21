export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  imageUrl?: string
}

export interface FamilyRoles {
  role: 'PARENT' | 'CHILD'
}

export interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    imageUrl?: string
    familyId: number
    role: FamilyRoles
  }
}
