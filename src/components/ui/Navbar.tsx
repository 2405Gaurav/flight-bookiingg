import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NavbarActions } from './NavbarActions'

export async function Navbar() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2 group">
          {/* Plane icon */}
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

        <NavbarActions user={user} />
      </div>
    </nav>
  )
}
