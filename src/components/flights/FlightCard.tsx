import Link from 'next/link'
import type { FlightRow } from '@/types/supabase'
import { getCity, formatTime, formatDuration, formatDate, formatPrice } from '@/lib/airports'

export default function FlightCard({ flight }: { flight: FlightRow }) {
  const duration = formatDuration(flight.departs_at, flight.arrives_at)

  return (
    <div className="glass-card p-5 sm:p-6 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: route + times */}
        <div className="flex-1 min-w-0">
          {/* Flight number + date */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
              {flight.flight_no}
            </span>
            <span className="text-xs text-muted">{formatDate(flight.departs_at)}</span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted">{flight.aircraft_type}</span>
          </div>

          {/* Route visualization */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Origin */}
            <div className="text-left min-w-0">
              <p className="text-xl font-bold leading-none">{formatTime(flight.departs_at)}</p>
              <p className="text-sm text-muted mt-1">{flight.origin}</p>
              <p className="text-xs text-muted/70 truncate">{getCity(flight.origin)}</p>
            </div>

            {/* Flight path */}
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

            {/* Destination */}
            <div className="text-right min-w-0">
              <p className="text-xl font-bold leading-none">{formatTime(flight.arrives_at)}</p>
              <p className="text-sm text-muted mt-1">{flight.destination}</p>
              <p className="text-xs text-muted/70 truncate">{getCity(flight.destination)}</p>
            </div>
          </div>
        </div>

        {/* Right: price + book */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-3 sm:pl-6 sm:border-l sm:border-border sm:min-w-[140px]">
          <div className="text-right">
            <p className="text-xs text-muted">Starting from</p>
            <p className="text-2xl font-bold text-primary leading-tight">
              {formatPrice(flight.base_price)}
            </p>
          </div>
          <Link
            href={`/booking/${flight.id}`}
            className="btn-primary text-sm py-2.5 px-6 group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow whitespace-nowrap"
          >
            Select →
          </Link>
        </div>
      </div>
    </div>
  )
}
