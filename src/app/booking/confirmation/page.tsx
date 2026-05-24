'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useFlightStore } from '@/stores/useFlightStore'
import { getCity, formatTime, formatDate, formatDuration, formatPrice } from '@/lib/airports'

const CLASS_LABELS: Record<string, string> = {
  first: 'First Class',
  business: 'Business',
  economy: 'Economy',
}

type ConfettiSpec = {
  delay: number
  left: number
  color: string
  size: number
  rotation: number
  duration: number
}

function hashStringToSeed(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function prng01(seed: number, index: number) {
  let t = seed + index * 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), 1 | t)
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function ConfettiParticle({ spec }: { spec: ConfettiSpec }) {
  const { delay, left, color, size, rotation, duration } = spec
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: '-10px',
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        borderRadius: '2px',
        transform: `rotate(${rotation}deg)`,
        animation: `confettiFall ${duration}s ease-in forwards`,
        animationDelay: `${delay}s`,
        opacity: 0,
      }}
    />
  )
}

export default function ConfirmationPage() {
  const router = useRouter()
  const {
    bookingResult,
    selectedFlight,
    selectedSeat,
    passengerForm,
    resetStore,
  } = useFlightStore()

  const confetti = useMemo<ConfettiSpec[]>(() => {
    if (!bookingResult) return []
    // Use Convex accent colors
    const colors = ['#e8522a', '#f59e0b', '#22c55e', '#8b5cf6', '#0ea5e9', '#c084fc'] as const
    const seed = hashStringToSeed(bookingResult.bookingId + bookingResult.pnrCode)
    return Array.from({ length: 40 }).map((_, i) => {
      const r1 = prng01(seed, i * 5 + 1)
      const r2 = prng01(seed, i * 5 + 2)
      const r3 = prng01(seed, i * 5 + 3)
      const r4 = prng01(seed, i * 5 + 4)
      const r5 = prng01(seed, i * 5 + 5)
      return {
        delay: Math.round(r1 * 150) / 100,
        left: Math.round(r2 * 10000) / 100,
        color: colors[Math.floor(r3 * colors.length)] ?? colors[0],
        size: 6 + Math.round(r4 * 6 * 10) / 10,
        rotation: Math.round(r5 * 3600) / 10,
        duration: 2 + Math.round(prng01(seed, i * 7 + 6) * 2 * 10) / 10,
      }
    })
  }, [bookingResult])

  useEffect(() => {
    if (!bookingResult) {
      router.replace('/flights')
    }
  }, [bookingResult, router])

  if (!bookingResult || !selectedFlight || !selectedSeat) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full" style={{ border: '2px solid var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const duration = formatDuration(selectedFlight.departs_at, selectedFlight.arrives_at)
  const totalPrice = selectedFlight.base_price + (selectedSeat.extra_fee ?? 0)

  function handleBookAnother() {
    resetStore()
    router.push('/flights')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-dark relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((spec, i) => (
          <ConfettiParticle key={i} spec={spec} />
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Success header */}
        <div className="text-center mb-8 animate-slide-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: 'var(--success)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Booking Confirmed!</h1>
          <p style={{ color: 'var(--muted)' }}>Your flight has been booked successfully.</p>
        </div>

        {/* PNR Code */}
        <div className="glass-card p-6 text-center mb-6 animate-slide-up stagger-1">
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Your PNR Code</p>
          <p className="text-4xl sm:text-5xl font-bold gradient-text tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
            {bookingResult.pnrCode}
          </p>
          <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
            Booking ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>{bookingResult.bookingId.slice(0, 8)}...</span>
          </p>
        </div>

        {/* Flight details */}
        <div className="glass-card p-5 sm:p-6 mb-6 animate-slide-up stagger-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
            Flight Details
          </h2>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ fontFamily: 'var(--font-mono)', background: 'rgba(232,82,42,0.12)', color: 'var(--accent)' }}
            >
              {selectedFlight.flight_no}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(selectedFlight.departs_at)}</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>•</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{selectedFlight.aircraft_type}</span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-left">
              <p className="text-xl font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(selectedFlight.departs_at)}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{selectedFlight.origin}</p>
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>{getCity(selectedFlight.origin)}</p>
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
              <p className="text-xl font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(selectedFlight.arrives_at)}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{selectedFlight.destination}</p>
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>{getCity(selectedFlight.destination)}</p>
            </div>
          </div>
        </div>

        {/* Seat + Passenger details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-5 animate-slide-up stagger-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              Seat Details
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,82,42,0.12)' }}>
                <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                  {selectedSeat.seat_number}
                </span>
              </div>
              <div>
                <p className="font-medium">Seat {selectedSeat.seat_number}</p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: selectedSeat.class === 'first' ? 'rgba(245,158,11,0.15)' : selectedSeat.class === 'business' ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.15)',
                    color: selectedSeat.class === 'first' ? '#f59e0b' : selectedSeat.class === 'business' ? '#8b5cf6' : '#0ea5e9',
                    border: `1px solid ${selectedSeat.class === 'first' ? 'rgba(245,158,11,0.3)' : selectedSeat.class === 'business' ? 'rgba(139,92,246,0.3)' : 'rgba(14,165,233,0.3)'}`,
                  }}
                >
                  {CLASS_LABELS[selectedSeat.class]}
                </span>
              </div>
            </div>
            {selectedSeat.extra_fee > 0 && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Extra fee: <span className="font-medium" style={{ color: 'var(--warning)' }}>{formatPrice(selectedSeat.extra_fee)}</span>
              </p>
            )}
          </div>

          <div className="glass-card p-5 animate-slide-up stagger-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              Passenger
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="text-sm font-medium">{passengerForm.fullName}</span>
              </div>
              {passengerForm.nationality && (
                <p className="text-xs pl-6" style={{ color: 'var(--muted)' }}>
                  Nationality: {passengerForm.nationality}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Total price */}
        <div className="glass-card p-5 mb-8 animate-slide-up stagger-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Total Paid</span>
            <span className="text-3xl font-bold" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up stagger-4">
          <button
            onClick={() => router.push('/my-bookings')}
            className="btn-primary flex-1 text-center py-3.5"
          >
            View My Bookings
          </button>
          <button
            onClick={handleBookAnother}
            className="btn-secondary flex-1 text-center py-3.5"
          >
            Book Another Flight
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary flex-none py-3.5 px-6 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
