import { RCTokenResponse, RCProfile } from './types'

const RC_AUTH_URL = 'https://www.recurse.com/oauth/authorize'
const RC_TOKEN_URL = 'https://www.recurse.com/oauth/token'
const RC_API_URL = 'https://www.recurse.com/api/v1'

export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.RC_ID!,
    redirect_uri: process.env.RC_REDIRECT_URI!,
    response_type: 'code',
    state,
  })
  return `${RC_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<RCTokenResponse> {
  const response = await fetch(RC_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.RC_ID!,
      client_secret: process.env.RC_SECRET!,
      redirect_uri: process.env.RC_REDIRECT_URI!,
      grant_type: 'authorization_code',
      code,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

export async function fetchUserProfile(accessToken: string): Promise<RCProfile> {
  const response = await fetch(`${RC_API_URL}/profiles/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch profile: ${error}`)
  }

  return response.json()
}
