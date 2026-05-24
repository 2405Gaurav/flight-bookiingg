'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/stores/useFlightStore'

type AuthStatus = { session: Session | null; isLoading: boolean }

export default function Navbar() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const resetStore = useFlightStore((s) => s.resetStore)

  const [auth, setAuth] = useState<AuthStatus>({ session: null, isLoading: true })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        setAuth({ session: null, isLoading: false })
        return
      }
      setAuth({ session: data.session ?? null, isLoading: false })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({ session: session ?? null, isLoading: false })
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    resetStore()
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const isAuthed = !!auth.session

  return (
    <nav className="fixed top-0 inset-x-0 z-50" style={{ background: 'var(--background-dark)', borderBottom: '1px solid var(--border)', height: '64px' }}>
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg
            className="w-7 h-7 transition-transform group-hover:rotate-[-8deg]"
            style={{ color: 'var(--accent)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff' }}>
            Source<span style={{ color: 'var(--accent)' }}>Asia</span>
          </span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-6">
          {auth.isLoading ? (
            <div className="skeleton h-8 w-28" />
          ) : isAuthed ? (
            <>
              <Link
                href="/flights"
                className="text-sm transition-colors py-2"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                Book a Flight
              </Link>
              <Link
                href="/my-bookings"
                className="text-sm transition-colors py-2"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                My Bookings
              </Link>
              <button
                onClick={handleLogout}
                className="btn-secondary text-xs sm:text-sm py-2 px-4"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm transition-colors py-2"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                Login
              </Link>
              <Link href="/signup" className="btn-primary text-xs sm:text-sm py-2 px-4">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span
            className="block w-5 h-0.5 transition-transform duration-200"
            style={{ background: '#fff', transform: mobileOpen ? 'rotate(45deg) translateY(8px)' : 'none' }}
          />
          <span
            className="block w-5 h-0.5 transition-opacity duration-200"
            style={{ background: '#fff', opacity: mobileOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-0.5 transition-transform duration-200"
            style={{ background: '#fff', transform: mobileOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="sm:hidden animate-fade-in"
          style={{ background: 'var(--background-dark)', borderTop: '1px solid var(--border)' }}
        >
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
            {auth.isLoading ? (
              <div className="skeleton h-10 w-full" />
            ) : isAuthed ? (
              <>
                <Link href="/flights" onClick={() => setMobileOpen(false)} className="text-sm py-2" style={{ color: 'var(--muted)' }}>
                  Book a Flight
                </Link>
                <Link href="/my-bookings" onClick={() => setMobileOpen(false)} className="text-sm py-2" style={{ color: 'var(--muted)' }}>
                  My Bookings
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-2.5 px-4 w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm py-2" style={{ color: 'var(--muted)' }}>
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary text-sm py-2.5 px-4 text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
