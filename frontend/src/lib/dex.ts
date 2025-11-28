// Dex OIDC configuration
export const DEXCONFIG = {
  issuer: 'http://localhost:8000/v1/dex',
  clientId: 'backend-client',
  redirectUri: 'http://localhost:8081/oidc/callback',
  scope: 'openid email profile offline_access',
  responseType: 'code', // Authorization code flow
} as const

export const DEX_ENDPOINTS = {
  authorization: `${DEXCONFIG.issuer}/auth`,
  token: `${DEXCONFIG.issuer}/token`,
  userinfo: `${DEXCONFIG.issuer}/userinfo`,
  discovery: `${DEXCONFIG.issuer}/.well-known/openid-configuration`,
} as const
