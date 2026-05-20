import { redirect } from 'next/navigation'
import { getFlightById } from '@/app/flights/actions'
import { getCity, formatTime, formatDate, formatDuration, formatPrice } from '@/lib/airports'
import PassengerForm from '@/components/bookings/PassengerForm'
import type { SeatClass } from '@/types/supabase'

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ flightId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { flightId } = await params
  const sp = await searchParams
  const preselectedClass = (
    typeof sp.class === 'string' ? sp.class : 'economy'
  ) as SeatClass

  const { data: flightData, error } = await getFlightById(flightId)

  if (error || !flightData) {
    redirect('/flights')
  }

  const { seats, ...flight } = flightData
  const duration = formatDuration(flight.departs_at, flight.arrives_at)

  return (
    <div className="min-h-[calc(100vh-4rem)] hero-gradient">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Flight summary card */}
        <div className="glass-card p-5 sm:p-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs font-mono font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
              {flight.flight_no}
            </span>
            <span className="text-xs text-muted">{formatDate(flight.departs_at)}</span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted">{flight.aircraft_type}</span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-left">
              <p className="text-2xl font-bold leading-none">{formatTime(flight.departs_at)}</p>
              <p className="text-sm text-muted mt-1">{flight.origin}</p>
              <p className="text-xs text-muted/70">{getCity(flight.origin)}</p>
            </div>

            <div className="flex-1 flex items-center gap-1 px-2">
              <div className="w-2 h-2 rounded-full border-2 border-primary shrink-0" />
              <div className="flex-1 relative">
                <div className="h-px bg-gradient-to-r from-primary/60 to-accent/60" />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-muted whitespace-nowrap">
                  {duration}
                </span>
              </div>
              <svg
                className="w-4 h-4 text-accent shrink-0 -ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14Z" />
              </svg>
              <div className="flex-1 relative">
                <div className="h-px bg-gradient-to-r from-accent/60 to-primary/60" />
              </div>
              <div className="w-2 h-2 rounded-full border-2 border-primary shrink-0" />
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold leading-none">{formatTime(flight.arrives_at)}</p>
              <p className="text-sm text-muted mt-1">{flight.destination}</p>
              <p className="text-xs text-muted/70">{getCity(flight.destination)}</p>
            </div>
          </div>

          {/* Base price */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted">Base fare</span>
            <span className="text-lg font-bold text-primary">{formatPrice(flight.base_price)}</span>
          </div>
        </div>

        {/* Passenger Form + Seat Selection */}
        <PassengerForm
          flight={flight}
          seats={seats}
          preselectedClass={preselectedClass}
        />
      </div>
    </div>
  )
}
