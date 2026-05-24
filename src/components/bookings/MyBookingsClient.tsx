'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingWithDetails } from '@/types/supabase'
import { cancelBookingAction } from '@/app/my-bookings/actions'
import { formatPrice, formatTime, formatDate, getCity } from '@/lib/airports'
import { useFlightStore } from '@/stores/useFlightStore'
import { useUserStore } from '@/stores/useUserStore'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import RescheduleModal from '@/components/bookings/RescheduleModal'

const CLASS_LABELS: Record<string, string> = {
  first: 'First Class',
  business: 'Business',
  economy: 'Economy',
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'confirmed'
      ? 'badge-confirmed'
      : status === 'rescheduled'
        ? 'badge-rescheduled'
        : 'badge-cancelled'

  return (
    <span className={`badge ${cls} capitalize`}>
      {status}
    </span>
  )
}

function isWithin2Hours(departsAt: string): boolean {
  const departTime = new Date(departsAt).getTime()
  const now = Date.now()
  return departTime - now < 2 * 60 * 60 * 1000
}

type Props = {
  initialBookings: BookingWithDetails[]
}

export default function MyBookingsClient({ initialBookings }: Props) {
  const router = useRouter()
  const resetStore = useFlightStore((s) => s.resetStore)
  const setCachedBookings = useUserStore((s) => s.setCachedBookings)

  const [bookings, setBookings] = useState<BookingWithDetails[]>(initialBookings)

  // Cancel state
  const [cancelTarget, setCancelTarget] = useState<BookingWithDetails | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // Reschedule state
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingWithDetails | null>(null)
  const [rescheduleSuccess, setRescheduleSuccess] = useState('')

  // Cache bookings in Zustand
  useState(() => {
    setCachedBookings(initialBookings)
  })

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return
    setCancelLoading(true)
    setCancelError('')

    const { error } = await cancelBookingAction(cancelTarget.id)

    if (error) {
      setCancelError(error)
      setCancelLoading(false)
      return
    }

    // Optimistic update
    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancelTarget.id ? { ...b, status: 'cancelled' as const } : b
      )
    )
    resetStore()
    setCancelTarget(null)
    setCancelLoading(false)
    router.refresh()
  }, [cancelTarget, resetStore, router])

  const handleRescheduleComplete = useCallback((feeCharged: number) => {
    setRescheduleTarget(null)
    setRescheduleSuccess(
      feeCharged > 0
        ? `Booking rescheduled! Additional fee: ${formatPrice(feeCharged)}`
        : 'Booking rescheduled successfully!'
    )
    router.refresh()
    // Auto-dismiss after 5s
    setTimeout(() => setRescheduleSuccess(''), 5000)
  }, [router])

  if (bookings.length === 0) {
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>
          No bookings yet
        </h3>
        <p className="text-sm text-center max-w-sm mb-6" style={{ color: 'var(--muted)', opacity: 0.7 }}>
          You haven&apos;t made any bookings. Start by searching for a flight!
        </p>
        <button onClick={() => router.push('/flights')} className="btn-primary py-2.5 px-6">
          Book a Flight
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Success toast */}
      {rescheduleSuccess && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm animate-fade-in flex items-center gap-2"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success)' }}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {rescheduleSuccess}
        </div>
      )}

      {/* Cancel error */}
      {cancelError && !cancelTarget && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm animate-fade-in"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)' }}
        >
          {cancelError}
        </div>
      )}

      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{bookings.length}</span>{' '}
        booking{bookings.length !== 1 ? 's' : ''} found
      </p>

      <div className="space-y-4">
        {bookings.map((booking, i) => {
          const isActive = booking.status !== 'cancelled'
          const canCancel = isActive && !isWithin2Hours(booking.flight.departs_at)
          const canReschedule = isActive

          return (
            <div
              key={booking.id}
              className={`glass-card p-5 sm:p-6 animate-slide-up stagger-${Math.min(i + 1, 4)}`}
              style={{ opacity: booking.status === 'cancelled' ? 0.6 : 1 }}
            >
              {/* Top row: PNR + status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-bold tracking-wider"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
                  >
                    {booking.pnr_code}
                  </span>
                  <StatusBadge status={booking.status} />
                </div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  Booked {formatDate(booking.booked_at)}
                </span>
              </div>

              {/* Flight info */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ fontFamily: 'var(--font-mono)', background: 'rgba(232,82,42,0.12)', color: 'var(--accent)' }}
                >
                  {booking.flight.flight_no}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(booking.flight.departs_at)}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>•</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{booking.flight.aircraft_type}</span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(booking.flight.departs_at)}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{booking.flight.origin} · {getCity(booking.flight.origin)}</p>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                  <div className="flex-1 h-px mx-1" style={{ background: 'var(--border)' }} />
                  <svg className="w-3 h-3 -mx-0.5" style={{ color: 'var(--accent)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14Z" />
                  </svg>
                  <div className="flex-1 h-px mx-1" style={{ background: 'var(--border)' }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(booking.flight.arrives_at)}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{booking.flight.destination} · {getCity(booking.flight.destination)}</p>
                </div>
              </div>

              {/* Seat + price row */}
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,82,42,0.12)' }}>
                    <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {booking.seat.seat_number}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Seat {booking.seat.seat_number}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
                      {CLASS_LABELS[booking.seat.class] ?? booking.seat.class}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                    {formatPrice(booking.total_price)}
                  </p>
                </div>
              </div>

              {/* Passenger info */}
              {booking.passengers.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  {booking.passengers[0].full_name}
                </div>
              )}

              {/* Actions */}
              {isActive && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setRescheduleTarget(booking)}
                    className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
                    disabled={!canReschedule}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    Reschedule
                  </button>
                  <button
                    onClick={() => { setCancelError(''); setCancelTarget(booking) }}
                    className="text-xs py-2 px-4 rounded-full flex items-center gap-1.5 transition-all duration-150"
                    disabled={!canCancel}
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(239,68,68,0.3)',
                      color: canCancel ? 'var(--error)' : 'var(--muted)',
                      opacity: canCancel ? 1 : 0.5,
                      cursor: canCancel ? 'pointer' : 'not-allowed',
                    }}
                    title={!canCancel ? 'Cancellation blocked within 2 hours of departure' : undefined}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Cancel confirm dialog */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => { setCancelTarget(null); setCancelError('') }}
        onConfirm={handleCancelConfirm}
        title="Cancel Booking?"
        description={
          cancelTarget
            ? `This will cancel your booking ${cancelTarget.pnr_code} (${cancelTarget.flight.flight_no}: ${cancelTarget.flight.origin} → ${cancelTarget.flight.destination}). The seat will be released. This action cannot be undone.`
            : ''
        }
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        variant="danger"
        loading={cancelLoading}
      />

      {/* Reschedule modal */}
      {rescheduleTarget && (
        <RescheduleModal
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          bookingId={rescheduleTarget.id}
          currentFlight={rescheduleTarget.flight}
          onRescheduleComplete={handleRescheduleComplete}
        />
      )}
    </>
  )
}
