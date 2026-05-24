'use client'

import { useRouter } from 'next/navigation'
import type { FlightRow } from '@/types/supabase'
import { getCity, formatTime, formatDuration, formatDate, formatPrice } from '@/lib/airports'
import { useFlightStore } from '@/stores/useFlightStore'

type FlightWithAvailability = FlightRow & {
  economyAvailable: number
  businessAvailable: number
  firstAvailable: number
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  delayed:   { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  cancelled: { bg: 'rgba(154,154,138,0.1)', text: '#9a9a8a', border: 'rgba(154,154,138,0.3)' },
  completed: { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
}

export default function FlightCard({ flight }: { flight: FlightWithAvailability }) {
  const router = useRouter()
  const setSelectedFlight = useFlightStore((s) => s.setSelectedFlight)
  const duration = formatDuration(flight.departs_at, flight.arrives_at)

  function handleSelectClass(cls: string) {
    setSelectedFlight(flight)
    router.push(`/booking/${flight.id}?class=${cls}`)
  }

  const classOptions = [
    {
      key: 'economy',
      label: 'Economy',
      available: flight.economyAvailable,
      color: '#0ea5e9',
    },
    {
      key: 'business',
      label: 'Business',
      available: flight.businessAvailable,
      color: '#8b5cf6',
    },
    {
      key: 'first',
      label: 'First',
      available: flight.firstAvailable,
      color: '#f59e0b',
    },
  ]

  const statusStyle = STATUS_STYLES[flight.status] ?? STATUS_STYLES.scheduled

  return (
    <div className="glass-card p-5 sm:p-6 transition-all duration-150" style={{ cursor: 'default' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: route + times */}
        <div className="flex-1 min-w-0">
          {/* Flight number + date + status */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ fontFamily: 'var(--font-mono)', background: 'rgba(232,82,42,0.12)', color: 'var(--accent)' }}
            >
              {flight.flight_no}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(flight.departs_at)}</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>•</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{flight.aircraft_type}</span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
              style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
            >
              {flight.status}
            </span>
          </div>

          {/* Route visualization */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-left min-w-0">
              <p className="text-xl font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(flight.departs_at)}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{flight.origin}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted)', opacity: 0.7 }}>{getCity(flight.origin)}</p>
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

            <div className="text-right min-w-0">
              <p className="text-xl font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(flight.arrives_at)}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{flight.destination}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted)', opacity: 0.7 }}>{getCity(flight.destination)}</p>
            </div>
          </div>
        </div>

        {/* Right: price + class select */}
        <div className="flex flex-col items-end justify-center gap-3 sm:pl-6 sm:min-w-[180px]" style={{ borderLeft: 'none' }}>
          <div className="hidden sm:block w-px self-stretch" style={{ background: 'var(--border)' }} />
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Starting from</p>
            <p className="text-2xl font-bold leading-tight" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
              {formatPrice(flight.base_price)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {classOptions.map((cls) => (
              <button
                key={cls.key}
                disabled={cls.available === 0}
                onClick={() => handleSelectClass(cls.key)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer"
                style={{
                  border: `1.5px solid ${cls.available > 0 ? cls.color + '40' : 'var(--border)'}`,
                  background: cls.available > 0 ? cls.color + '15' : 'transparent',
                  color: cls.available > 0 ? cls.color : 'var(--muted)',
                  opacity: cls.available > 0 ? 1 : 0.4,
                  cursor: cls.available > 0 ? 'pointer' : 'not-allowed',
                }}
                title={
                  cls.available > 0
                    ? `${cls.available} ${cls.label} seat${cls.available > 1 ? 's' : ''} available`
                    : `No ${cls.label} seats available`
                }
              >
                {cls.label}
                <span className="ml-1.5 text-[10px] opacity-70">
                  {cls.available > 0 ? cls.available : '—'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
