'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/stores/useUserStore'

export default function LoginPage() {
  const setSession = useUserStore((s) => s.setSession)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSession(data.session)
      router.push('/')
      router.refresh()
    }
  }

  return (
    <>
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
      >
        Sign in to <span className="gradient-text">SourceAsia</span>
      </h1>

      {error && (
        <p
          className="mb-4 text-sm p-3 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="form-input"
            placeholder="••••••••"
          />
        </div>
        <button
          id="login-submit-btn"
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>

      <p className="mt-6 text-sm text-center" style={{ color: 'var(--muted)' }}>
        No account?{' '}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
          Sign up
        </Link>
      </p>
    </>
  )
}