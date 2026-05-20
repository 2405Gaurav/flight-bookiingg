import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BookingForm from '@/components/bookings/BookingForm'
import { getCity, formatTime, formatDate, formatDuration } from '@/lib/airports'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Flight — SourceAsia',
  description: 'Select a seat and complete your booking.',
}

type Props = { params: Promise<{ flightId: string }> }

export default async function BookingPage({ params }: Props) {
  const { flightId } = await params
  const supabase = await createSupabaseServerClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch flight
  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .single()

  if (!flight) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Flight Not Found</h1>
        <p className="text-muted mb-6">This flight may have been removed or the link is invalid.</p>
        <Link href="/" className="btn-primary inline-block py-2.5 px-6">Search Flights</Link>
      </div>
    )
  }

  // Fetch seats
  const { data: seats } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', flightId)
    .order('seat_number', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-muted hover:text-primary transition-colors inline-flex items-center gap-1 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to search
      </Link>

      {/* Flight summary */}
      <div className="glass-card p-5 sm:p-6 mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-mono font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
            {flight.flight_no}
          </span>
          <span className="text-xs text-muted">{formatDate(flight.departs_at)}</span>
          <span className="text-xs text-muted">•</span>
          <span className="text-xs text-muted">{flight.aircraft_type}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{formatTime(flight.departs_at)}</p>
            <p className="text-sm text-muted">
              {flight.origin} · {getCity(flight.origin)}
            </p>
          </div>

          <div className="flex-1 mx-4 sm:mx-8 text-center">
            <p className="text-xs text-muted mb-1">
              {formatDuration(flight.departs_at, flight.arrives_at)}
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <p className="text-[10px] text-muted mt-1">Direct</p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold">{formatTime(flight.arrives_at)}</p>
            <p className="text-sm text-muted">
              {flight.destination} · {getCity(flight.destination)}
            </p>
          </div>
        </div>
      </div>

      {/* Booking form */}
      <div className="animate-slide-up stagger-2">
        <BookingForm
          flight={flight}
          seats={seats ?? []}
          userId={user.id}
        />
      </div>
    </div>
  )
}
