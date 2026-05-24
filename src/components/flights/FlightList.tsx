import type { FlightRow } from '@/types/supabase'
import FlightCard from './FlightCard'

type FlightWithAvailability = FlightRow & {
  economyAvailable: number
  businessAvailable: number
  firstAvailable: number
}

export default function FlightList({ flights }: { flights: FlightWithAvailability[] }) {
  if (!flights || flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'var(--surface)' }}
        >
          <svg
            className="w-12 h-12"
            style={{ color: 'var(--muted)', opacity: 0.4 }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>No flights found</h3>
        <p className="text-sm text-center max-w-sm" style={{ color: 'var(--muted)', opacity: 0.7 }}>
          We couldn&apos;t find any flights matching your search criteria. Try adjusting your dates
          or route.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        Found <span className="font-medium" style={{ color: 'var(--foreground)' }}>{flights.length}</span>{' '}
        flight{flights.length !== 1 ? 's' : ''}
      </p>
      <div className="space-y-4">
        {flights.map((flight, i) => (
          <div key={flight.id} className={`animate-slide-up stagger-${Math.min(i + 1, 4)}`}>
            <FlightCard flight={flight} />
          </div>
        ))}
      </div>
    </div>
  )
}
