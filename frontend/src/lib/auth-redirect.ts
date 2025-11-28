import { DEXCONFIG } from './dex'

export interface UserInfo {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
}

// Token storage keys
const TOKEN_KEY = 'dex_access_token'
const ID_TOKEN_KEY = 'dex_id_token'
const REFRESH_TOKEN_KEY = 'dex_refresh_token'
const USER_KEY = 'dex_user'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): UserInfo | null {
  const user = sessionStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function getStoredRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function storeTokens(accessToken: string, idToken: string, refreshToken?: string): void {
  sessionStorage.setItem(TOKEN_KEY, accessToken)
  sessionStorage.setItem(ID_TOKEN_KEY, idToken)
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function storeUser(user: UserInfo): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ID_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

// Generate state for CSRF protection (Dex handles state verification)
function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const bytes = Array.from(array)
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Redirect to Dex via backend (standard OIDC flow, no PKCE)
export async function redirectToAuth(): Promise<void> {
  const state = generateState()

  const params = new URLSearchParams({
    client_id: DEXCONFIG.clientId,
    redirect_uri: 'http://localhost:8000/api/auth/callback',
    response_type: 'code',
    scope: DEXCONFIG.scope,
    state,
  })

  // Redirect to Dex authorization endpoint
  window.location.href = `http://localhost:8000/v1/dex/auth?${params.toString()}`
}

// Parse tokens from URL fragment (backend redirects with #tokens=...)
export function parseTokensFromFragment(): boolean {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const tokensJson = params.get('tokens')

  if (!tokensJson) {
    return false
  }

  try {
    const tokens = JSON.parse(tokensJson)
    storeTokens(tokens.access_token, tokens.id_token, tokens.refresh_token)
    storeUser(tokens.user)

    // Clean up URL
    window.location.hash = ''
    return true
  } catch (error) {
    console.error('Failed to parse tokens:', error)
    return false
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      return false
    }

    const tokens = await response.json()
    storeTokens(tokens.access_token, tokens.id_token || getStoredToken()!, tokens.refresh_token)

    return true
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

// Revoke token
export async function revokeToken(token?: string): Promise<void> {
  const tokenToRevoke = token || getStoredToken()
  if (!tokenToRevoke) {
    return
  }

  try {
    await fetch('/api/auth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: tokenToRevoke,
      }),
    })
  } catch (error) {
    console.error('Token revocation failed:', error)
  }
}
