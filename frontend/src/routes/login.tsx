import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/LoginForm'
import { useEffect } from 'react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/protected')
    }
  }, [isAuthenticated, navigate])

  const handleLogin = (_username: string, _password: string) => {
    // Credentials are prefilled, redirect to Dex (no popup, no async)
    login()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-purple-200">Sign in to access your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-purple-800 bg-opacity-40 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-600 p-8">
          <LoginForm onSubmit={handleLogin} />
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-purple-300 hover:text-purple-100 transition-colors"
          >
            ← Back to home
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-xs text-purple-400">
          <p>Clicking "Sign In" redirects to Dex login</p>
          <p className="mt-1">No popups - full page redirect</p>
        </div>
      </div>
    </div>
  )
}
