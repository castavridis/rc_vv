export interface RCProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  image_path: string | null
  batch: {
    id: number
    name: string
    short_name: string
  } | null
  stints: Array<{
    id: number
    start_date: string
    end_date: string | null
    type: string
    batch: {
      id: number
      name: string
      short_name: string
    }
  }>
}

export interface RCTokenResponse {
  access_token: string
  token_type: string
  created_at: number
}

export interface User {
  id: string
  email: string
  name: string
  rcId: number
  imagePath: string | null
}

export interface Session {
  user: User
  accessToken: string
  expiresAt: number
}
