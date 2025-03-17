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
}

export interface UpdateProfileRequest {
  id: number
  name?: string
  role?: ProfileRole
  pin?: string
  currentPin?: string
  image?: File
}

export interface SelectProfileRequest {
  profileId: number
  pin?: string
}

export interface VerifyPinRequest {
  profileId: number
  pin: string
}

export interface ProfilesList {
  profiles: Profile[]
}

export interface ProfileResponse {
  profile: Profile
  token?: string
}
