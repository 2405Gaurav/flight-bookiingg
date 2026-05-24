import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserBookings } from './actions'
import MyBookingsClient from '@/components/bookings/MyBookingsClient'

export const metadata = {
  title: 'My Bookings — SourceAsia',
  description: 'View, manage, reschedule, or cancel your flight bookings.',
}

export default async function MyBookingsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookings, error } = await getUserBookings()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            My <span className="gradient-text">Bookings</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Manage, reschedule, or cancel your flight bookings.
          </p>
        </div>

        {error ? (
          <div
            className="rounded-xl px-4 py-3 text-sm animate-fade-in"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)' }}
          >
            {error}
          </div>
        ) : (
          <MyBookingsClient initialBookings={bookings ?? []} />
        )}
      </div>
    </div>
  )
}
