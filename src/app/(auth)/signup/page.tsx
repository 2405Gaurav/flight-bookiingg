'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Create account</h1>

      {error && (
        <p className="mb-4 text-sm text-error bg-error/10 border border-error/20 p-3 rounded-lg">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            className="form-input"
            placeholder="Min. 6 characters"
          />
        </div>
        <button
          id="signup-submit-btn"
          onClick={handleSignup}
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </div>

      <p className="mt-6 text-sm text-center text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </>
  )
}