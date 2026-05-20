'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useFlightStore } from '@/stores/useFlightStore'
import type { User } from '@supabase/supabase-js'

export function NavbarActions({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const resetStore = useFlightStore((s) => s.resetStore)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    resetStore()
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <>
        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/flights"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Book a Flight
          </Link>
          <Link
            href="/my-bookings"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            My Bookings
          </Link>
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
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

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border sm:hidden animate-fade-in z-50">
            <div className="flex flex-col p-4 gap-3">
              <Link
                href="/flights"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted hover:text-foreground transition-colors py-2"
              >
                Book a Flight
              </Link>
              <Link
                href="/my-bookings"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted hover:text-foreground transition-colors py-2"
              >
                My Bookings
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  handleSignOut()
                }}
                className="btn-secondary text-sm py-2 px-4 w-full text-left"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden sm:flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
        <Link href="/signup" className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4">
          Sign up
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="sm:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
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

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border sm:hidden animate-fade-in z-50">
          <div className="flex flex-col p-4 gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-sm text-muted hover:text-foreground transition-colors py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="btn-primary text-sm py-2 px-4 text-center"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
