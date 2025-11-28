import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-purple-800 bg-opacity-40 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-600 p-8 mb-6">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="inline-block bg-purple-600 bg-opacity-50 rounded-full p-6 mb-4">
              <svg
                className="w-16 h-16 text-purple-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Access Granted</h1>
            <p className="text-xl text-purple-200">This is a private page</p>
          </div>

          {/* Divider */}
          <div className="border-t border-purple-600 my-6"></div>

          {/* User Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-4">User Information</h2>

            {user?.email && (
              <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
                <p className="text-sm text-purple-300 mb-1">Email</p>
                <p className="text-lg text-white font-medium">{user.email}</p>
              </div>
            )}

            {user?.preferred_username && (
              <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
                <p className="text-sm text-purple-300 mb-1">Username</p>
                <p className="text-lg text-white font-medium">{user.preferred_username}</p>
              </div>
            )}

            {user?.name && (
              <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
                <p className="text-sm text-purple-300 mb-1">Full Name</p>
                <p className="text-lg text-white font-medium">{user.name}</p>
              </div>
            )}

            <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
              <p className="text-sm text-purple-300 mb-1">User ID</p>
              <p className="text-lg text-white font-mono break-all">{user?.sub}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleLogout}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-400"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-purple-300">
          <p>🔐 You are now authenticated via Dex OIDC</p>
          <p className="mt-2">Token stored securely in browser session</p>
        </div>
      </div>
    </div>
  )
}
