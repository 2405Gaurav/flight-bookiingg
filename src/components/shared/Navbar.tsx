'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/stores/useFlightStore'

type AuthStatus = { session: Session | null; isLoading: boolean }

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-sm text-muted hover:text-foreground transition-colors py-2"
    >
      {children}
    </Link>
  )
}

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
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <svg
            className="w-7 h-7 text-primary transition-transform group-hover:rotate-[-8deg]"
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
          <span className="text-lg font-bold tracking-tight">
            Source<span className="text-primary">Asia</span>
          </span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-4">
          {auth.isLoading ? (
            <div className="h-8 w-28 bg-surface-hover rounded-lg animate-pulse" />
          ) : isAuthed ? (
            <>
              <NavLink href="/flights">Book a Flight</NavLink>
              <NavLink href="/my-bookings">My Bookings</NavLink>
              <button
                onClick={handleLogout}
                className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">Login</NavLink>
              <Link href="/signup" className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4">
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
            className={`block w-5 h-0.5 bg-foreground transition-transform duration-200 ${
              mobileOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-foreground transition-opacity duration-200 ${
              mobileOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-foreground transition-transform duration-200 ${
              mobileOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
            {auth.isLoading ? (
              <div className="h-10 bg-surface-hover rounded-lg animate-pulse" />
            ) : isAuthed ? (
              <>
                <NavLink href="/flights" onClick={() => setMobileOpen(false)}>
                  Book a Flight
                </NavLink>
                <NavLink href="/my-bookings" onClick={() => setMobileOpen(false)}>
                  My Bookings
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-2.5 px-4 w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink href="/login" onClick={() => setMobileOpen(false)}>
                  Login
                </NavLink>
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

