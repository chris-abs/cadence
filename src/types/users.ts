export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  imageUrl: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containers: any[] // TODO: type properly once we integrate containers
  createdAt: string
  updatedAt: string
}

export interface UserResponse {
  user: User
  token: string
}
