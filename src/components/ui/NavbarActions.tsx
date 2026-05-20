'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function NavbarActions({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
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
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
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
  )
}
