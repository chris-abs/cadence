import { Family } from '@/Family/types'
import { Profile } from '@/Profile/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  familyName: string
  ownerName: string
}

export interface FamilyAuthResponse {
  token: string
  family: Family
  profiles: Profile[]
}
