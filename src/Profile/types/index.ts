export type ProfileRole = 'PARENT' | 'CHILD'

export interface Profile {
  id: number
  familyId: number
  name: string
  role: ProfileRole
  imageUrl: string
  isOwner: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProfileRequest {
  name: string
  role: ProfileRole
  pin?: string
  imageUrl?: string
}

export interface UpdateProfileRequest {
  id: number
  name?: string
  role?: ProfileRole
  pin?: string
  currentPin?: string
  imageUrl?: string
}

export interface VerifyPinRequest {
  profileId: number
  pin: string
}
