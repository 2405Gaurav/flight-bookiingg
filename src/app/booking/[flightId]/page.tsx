import { redirect } from 'next/navigation'
import { getFlightById } from '@/app/flights/actions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSeatsForFlight, getUserBookedSeat } from '@/app/booking/[flightId]/actions'
import { getCity, formatTime, formatDate, formatDuration, formatPrice } from '@/lib/airports'
import PassengerForm from '@/components/bookings/PassengerForm'
import type { SeatClass } from '@/types/supabase'

const SEAT_CLASSES: SeatClass[] = ['economy', 'business', 'first']

function parseSeatClass(value: string | undefined): SeatClass {
  if (value && SEAT_CLASSES.includes(value as SeatClass)) {
    return value as SeatClass
  }
  return 'economy'
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ flightId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { flightId } = await params
  const sp = await searchParams
  const selectedClass = parseSeatClass(typeof sp.class === 'string' ? sp.class : undefined)

  const { data: flightData, error } = await getFlightById(flightId)

  if (error || !flightData) {
    redirect('/flights')
  }

  const { seats, ...flight } = flightData
  void seats

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: seatRows, error: seatsError }, bookedSeatResult] = await Promise.all([
    getSeatsForFlight(flightId),
    user
      ? getUserBookedSeat(flightId, user.id)
      : Promise.resolve({ data: null as string | null, error: null as string | null }),
  ])

  if (seatsError || !seatRows) {
    redirect('/flights')
  }

  const userBookedSeatId =
    bookedSeatResult.error || !bookedSeatResult.data ? undefined : bookedSeatResult.data

  const duration = formatDuration(flight.departs_at, flight.arrives_at)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Flight summary card */}
        <div className="glass-card p-5 sm:p-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ fontFamily: 'var(--font-mono)', background: 'rgba(232,82,42,0.12)', color: 'var(--accent)' }}
            >
              {flight.flight_no}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(flight.departs_at)}</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>•</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{flight.aircraft_type}</span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-left">
              <p className="text-2xl font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(flight.departs_at)}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{flight.origin}</p>
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>{getCity(flight.origin)}</p>
            </div>

            <div className="flex-1 flex items-center gap-1 px-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ border: '2px solid var(--accent)' }} />
              <div className="flex-1 relative">
                <div className="h-px" style={{ background: 'linear-gradient(to right, var(--accent), rgba(232,82,42,0.3))' }} />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                  {duration}
                </span>
              </div>
              <svg className="w-4 h-4 shrink-0 -ml-0.5" style={{ color: 'var(--accent)' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14Z" />
              </svg>
              <div className="flex-1 relative">
                <div className="h-px" style={{ background: 'linear-gradient(to right, rgba(232,82,42,0.3), var(--accent))' }} />
              </div>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ border: '2px solid var(--accent)' }} />
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(flight.arrives_at)}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{flight.destination}</p>
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>{getCity(flight.destination)}</p>
            </div>
          </div>

          {/* Base price */}
          <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>Base fare</span>
            <span className="text-lg font-bold" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{formatPrice(flight.base_price)}</span>
          </div>
        </div>

        <PassengerForm
          flight={flight}
          initialSeats={seatRows}
          userBookedSeatId={userBookedSeatId}
          selectedClass={selectedClass}
        />
      </div>
    </div>
  )
}
