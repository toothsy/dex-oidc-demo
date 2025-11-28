import { useState } from 'react'

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState('admin-dex@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Username and password are required')
      return
    }

    setLoading(true)
    // Note: This will trigger a page redirect, so loading state doesn't matter
    onSubmit(username, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-purple-200 mb-2">
          Username or Email
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 bg-purple-900 bg-opacity-50 border border-purple-600 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="admin-dex@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-purple-900 bg-opacity-50 border border-purple-600 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter your password"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-400"
      >
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>

      <div className="text-center text-sm text-purple-300">
        <p>Demo credentials:</p>
        <p className="font-mono text-purple-200 mt-1">admin-dex@example.com / password</p>
      </div>
    </form>
  )
}
