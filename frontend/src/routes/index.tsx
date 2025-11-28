import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/protected')
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Welcome to
            <span className="block bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent mt-2">
              Dex Auth
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Secure authentication powered by Dex OIDC. Experience seamless login with enterprise-grade security.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-400"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-transparent border-2 border-purple-300 hover:bg-purple-800 text-purple-100 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-400"
          >
            Sign In
          </button>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-purple-600">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure</h3>
            <p className="text-purple-200">OAuth2 & OIDC standards with enterprise security</p>
          </div>
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-purple-600">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-2">Fast</h3>
            <p className="text-purple-200">Lightning-quick authentication flow</p>
          </div>
          <div className="bg-purple-800 bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-purple-600">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-white mb-2">Beautiful</h3>
            <p className="text-purple-200">Modern UI with smooth animations</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-purple-300 text-sm">
          <p>Powered by Dex • Built with React & TailwindCSS</p>
        </div>
      </div>
    </div>
  )
}
