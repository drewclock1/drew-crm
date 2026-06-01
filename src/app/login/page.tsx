'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup'
    const body =
      mode === 'signin'
        ? { email, password }
        : { email, password, full_name: fullName }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const signInRes = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!signInRes.ok) {
        const d = await signInRes.json()
        setError(d.error || 'Account created but sign in failed')
        setLoading(false)
        return
      }
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0C3B6E' }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #C9951A 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #2B7FD4 0%, transparent 50%)`,
        }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl p-8 animate-slide-up"
        style={{
          background: '#ffffff',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.2)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #C9951A, #E8AE2A)',
              boxShadow: '0 6px 20px rgba(201,149,26,0.4)',
            }}
          >
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: '#0C3B6E' }}
          >
            Drew CRM
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Insurance Sales &amp; Recruiting
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex p-1 rounded-xl mb-6"
          style={{ background: '#f1f5f9' }}
        >
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={
                mode === m
                  ? {
                      background: '#ffffff',
                      color: '#0C3B6E',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="input"
                placeholder="Drew Clock"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="input"
                placeholder="••••••••"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#9f1239',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
              </span>
            ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#94a3b8' }}>
          Powered by{' '}
          <span className="font-semibold" style={{ color: '#C9951A' }}>
            Voraxon
          </span>
        </p>
      </div>
    </div>
  )
}
