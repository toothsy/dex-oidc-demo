import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  getStoredToken,
  getStoredUser,
  clearAuth,
  redirectToAuth,
  parseTokensFromFragment,
  revokeToken,
  type UserInfo,
} from '@/lib/auth-redirect'

interface AuthContextType {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
  setUser: (user: UserInfo) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Parse tokens from URL fragment if present (backend redirect)
    const hasTokens = parseTokensFromFragment()

    if (hasTokens) {
      // Tokens parsed, load user
      const storedUser = getStoredUser()
      if (storedUser) {
        setUserState(storedUser)
      }
    } else {
      // Check for existing session
      const token = getStoredToken()
      const storedUser = getStoredUser()

      if (token && storedUser) {
        setUserState(storedUser)
      }
    }

    setIsLoading(false)
  }, [])

  const login = () => {
    // Full page redirect to Dex (no popup)
    redirectToAuth()
  }

  const logout = async () => {
    // Revoke token on backend
    await revokeToken()
    clearAuth()
    setUserState(null)
  }

  const setUser = (user: UserInfo) => {
    setUserState(user)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
