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
  const [scrolled, setScrolled] = useState(false)

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

    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
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
    <>
      {/* Floating navbar wrapper — provides top spacing & horizontal padding */}
      <div
        className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6"
        style={{ paddingTop: '14px' }}
      >
        {/* Pill container */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            background: scrolled
              ? 'rgba(10,10,10,0.92)'
              : 'rgba(13,13,13,0.80)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
            boxShadow: scrolled
              ? '0 4px 32px rgba(0,0,0,0.45)'
              : '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Main row */}
          <div className="flex items-center justify-between px-4 sm:px-5" style={{ height: '54px' }}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" style={{ flexShrink: 0 }}>
              <svg
                className="w-6 h-6 transition-transform group-hover:rotate-[-8deg]"
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
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: '#fff',
                }}
              >
                Source<span style={{ color: 'var(--accent)' }}>Asia</span>
              </span>
            </Link>

            {/* Desktop nav links (center) */}
            {isAuthed && !auth.isLoading && (
              <div className="hidden sm:flex items-center gap-1" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                <Link
                  href="/flights"
                  className="text-sm px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--muted)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Book a Flight
                </Link>
                <Link
                  href="/my-bookings"
                  className="text-sm px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--muted)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  My Bookings
                </Link>
              </div>
            )}

            {/* Desktop right actions */}
            <div className="hidden sm:flex items-center gap-2">
              {auth.isLoading ? (
                <div className="skeleton h-8 w-24 rounded-lg" />
              ) : isAuthed ? (
                <button
                  onClick={handleLogout}
                  className="text-sm px-4 py-1.5 rounded-lg transition-all"
                  style={{
                    color: 'var(--muted)',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--muted)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: 'var(--muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--muted)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm px-4 py-1.5 rounded-lg font-semibold transition-all"
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden flex flex-col justify-center gap-1.5 p-2 rounded-lg"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              style={{ color: '#fff' }}
            >
              <span
                className="block w-5 h-px"
                style={{
                  background: '#fff',
                  transition: 'transform 0.2s ease',
                  transform: mobileOpen ? 'rotate(45deg) translate(2px, 3.5px)' : 'none',
                }}
              />
              <span
                className="block w-5 h-px"
                style={{
                  background: '#fff',
                  transition: 'opacity 0.2s ease',
                  opacity: mobileOpen ? 0 : 1,
                }}
              />
              <span
                className="block w-5 h-px"
                style={{
                  background: '#fff',
                  transition: 'transform 0.2s ease',
                  transform: mobileOpen ? 'rotate(-45deg) translate(2px, -3.5px)' : 'none',
                }}
              />
            </button>
          </div>

          {/* Mobile dropdown — inside the pill */}
          {mobileOpen && (
            <div
              className="sm:hidden animate-fade-in"
              style={{
                borderTop: '1px solid var(--border)',
                padding: '12px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {auth.isLoading ? (
                <div className="skeleton h-10 w-full rounded-lg" />
              ) : isAuthed ? (
                <>
                  <Link
                    href="/flights"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm px-3 py-2.5 rounded-lg transition-all"
                    style={{ color: 'var(--muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--muted)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Book a Flight
                  </Link>
                  <Link
                    href="/my-bookings"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm px-3 py-2.5 rounded-lg transition-all"
                    style={{ color: 'var(--muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--muted)'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    My Bookings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm px-3 py-2.5 rounded-lg text-left mt-1 transition-all"
                    style={{
                      color: 'var(--muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm px-3 py-2.5 rounded-lg transition-all"
                    style={{ color: 'var(--muted)' }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm px-3 py-2.5 rounded-lg font-semibold text-center mt-1 transition-all"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacer so page content doesn't hide under the floating nav */}
      <div style={{ height: '82px' }} />
    </>
  )
}