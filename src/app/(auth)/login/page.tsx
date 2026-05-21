'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
//as we are uisng the supabse auth 
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// useRouter — programmatic navigation (redirect after login).
// Link — client-side navigation without full page reload.
import { useUserStore } from '@/stores/useUserStore'

export default function LoginPage() {

  const setSession = useUserStore((s) => s.setSession)

  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  // supabase — your connection to Supabase, gives access to .auth, .from(), .channel() etc.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error,data} = await supabase.auth.signInWithPassword({ email, password })
    // → if valid: returns { data: { session, user }, error: null }
    // → if invalid: returns { data: null, error: { message: "..." } }
  //   Supabase also automatically:
  // - Sets a cookie with the JWT session token
  // - The middleware reads this cookie on every request
  // - That's how Server Components know who's logged in
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSession(data.session)
      router.push('/')
      router.refresh()
      // router.refresh() is critical
      //  without it, the landing page's Server Component still thinks the user is logged out because it cached the old response
      // . refresh() forces it to re-check the session cookie.
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Sign in</h1>

      {error && (
        <p className="mb-4 text-sm text-error bg-error/10 border border-error/20 p-3 rounded-lg">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Email</label>
          <input
            id="login-email"
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
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
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

      <p className="mt-6 text-sm text-center text-muted">
        No account?{' '}
        <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
      </p>
    </>
  )
}