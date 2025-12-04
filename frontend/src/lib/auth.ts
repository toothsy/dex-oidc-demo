import { DEXCONFIG, DEX_ENDPOINTS } from './dex'

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  id_token: string
  refresh_token?: string
}

export interface UserInfo {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
}

// Token storage
const TOKEN_KEY = 'dex_access_token'
const ID_TOKEN_KEY = 'dex_id_token'
const USER_KEY = 'dex_user'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): UserInfo | null {
  const user = sessionStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function storeTokens(tokenResponse: TokenResponse): void {
  sessionStorage.setItem(TOKEN_KEY, tokenResponse.access_token)
  if (tokenResponse.id_token) {
    sessionStorage.setItem(ID_TOKEN_KEY, tokenResponse.id_token)
  }
}

export function storeUser(user: UserInfo): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ID_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

// Generate authorization URL
export async function getAuthorizationUrl(): Promise<string> {
  const params = new URLSearchParams({
    client_id: DEXCONFIG.clientId,
    redirect_uri: DEXCONFIG.redirectUri,
    response_type: DEXCONFIG.responseType,
    scope: DEXCONFIG.scope,
  })

  return `${DEX_ENDPOINTS.authorization}?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: DEXCONFIG.clientId,
    redirect_uri: DEXCONFIG.redirectUri,
  })

  const response = await fetch(DEX_ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

// Decode JWT payload
function decodeJWT(token: string): any {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT')
  }

  const payload = parts[1]
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(decoded)
}

// Extract user info from ID token
export function getUserInfoFromIdToken(idToken: string): UserInfo {
  const payload = decodeJWT(idToken)

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    preferred_username: payload.preferred_username,
  }
}

// Fetch user info with access token
export async function fetchUserInfo(accessToken: string): Promise<UserInfo> {
  const response = await fetch(DEX_ENDPOINTS.userinfo, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}

// Start OAuth2 flow in popup
export async function startAuthFlowPopup(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const authUrl = await getAuthorizationUrl()
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      authUrl,
      'dex-auth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      reject(new Error('Popup blocked'))
      return
    }

    // Listen for callback message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'oauth-callback') {
        window.removeEventListener('message', handleMessage)
        popup.close()

        if (event.data.code) {
          resolve(event.data.code)
        } else {
          reject(new Error(event.data.error || 'Authorization failed'))
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        reject(new Error('Authentication cancelled'))
      }
    }, 500)
  })
}

// Complete authentication flow
export async function authenticate(): Promise<UserInfo> {
  try {
    // Start auth flow in popup
    const code = await startAuthFlowPopup()

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code)
    storeTokens(tokenResponse)

    // Extract user info from ID token
    const userInfo = getUserInfoFromIdToken(tokenResponse.id_token)
    storeUser(userInfo)

    return userInfo
  } catch (error) {
    clearAuth()
    throw error
  }
}
