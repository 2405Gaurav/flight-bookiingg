import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCity, formatTime, formatDate, formatDuration, formatPrice } from '@/lib/airports'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Booking Confirmed — SourceAsia',
  description: 'Your flight booking has been confirmed.',
}

type Props = { params: Promise<{ bookingId: string }> }

export default async function ConfirmationPage({ params }: Props) {
  const { bookingId } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch booking with related data
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
        <p className="text-muted mb-6">We couldn&#39;t find this booking.</p>
        <Link href="/" className="btn-primary inline-block py-2.5 px-6">Go Home</Link>
      </div>
    )
  }

  // Fetch flight
  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', booking.flight_id)
    .single()

  // Fetch seat
  const { data: seat } = await supabase
    .from('seats')
    .select('*')
    .eq('id', booking.seat_id)
    .single()

  // Fetch passenger
  const { data: passengers } = await supabase
    .from('passengers')
    .select('*')
    .eq('booking_id', bookingId)

  const passenger = passengers?.[0]

  if (!flight || !seat) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Error Loading Booking</h1>
        <Link href="/" className="btn-primary inline-block py-2.5 px-6">Go Home</Link>
      </div>
    )
  }

  const classLabels: Record<string, string> = {
    first: 'First Class',
    business: 'Business',
    economy: 'Economy',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Success badge */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 border border-success/30 mb-4">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Booking Confirmed!</h1>
        <p className="text-muted">Your flight has been booked successfully.</p>
      </div>

      {/* Boarding-pass style card */}
      <div className="glass-card overflow-hidden animate-slide-up stagger-2">
        {/* PNR Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5">Booking Reference</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono tracking-wider text-primary">
              {booking.pnr_code}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5">Status</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Flight Details */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
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
              <p className="text-sm font-medium">{flight.origin}</p>
              <p className="text-xs text-muted">{getCity(flight.origin)}</p>
            </div>
            <div className="text-center flex-1 mx-4">
              <p className="text-xs text-muted">{formatDuration(flight.departs_at, flight.arrives_at)}</p>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent my-1.5" />
              <p className="text-[10px] text-muted">Direct</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatTime(flight.arrives_at)}</p>
              <p className="text-sm font-medium">{flight.destination}</p>
              <p className="text-xs text-muted">{getCity(flight.destination)}</p>
            </div>
          </div>
        </div>

        {/* Seat & Passenger */}
        <div className="px-6 py-5 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Seat</p>
            <p className="text-lg font-bold font-mono">{seat.seat_number}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Class</p>
            <p className="text-sm font-medium">{classLabels[seat.class] ?? seat.class}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Passenger</p>
            <p className="text-sm font-medium truncate">{passenger?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Passport</p>
            <p className="text-sm font-mono">{passenger?.passport_no ?? '—'}</p>
          </div>
        </div>

        {/* Price */}
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-muted">Total Paid</span>
          <span className="text-xl font-bold text-primary">{formatPrice(booking.total_price)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 animate-slide-up stagger-3">
        <Link href="/my-bookings" className="btn-primary flex-1 text-center py-3">
          View My Bookings
        </Link>
        <Link href="/" className="btn-secondary flex-1 text-center py-3">
          Book Another Flight
        </Link>
      </div>
    </div>
  )
}
