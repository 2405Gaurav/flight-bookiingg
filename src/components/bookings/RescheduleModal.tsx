'use client'

import { useEffect, useState, useCallback } from 'react'
import type { FlightRow, SeatRow, SeatClass } from '@/types/supabase'
import { getAlternativeFlights, getSeatsForReschedule, rescheduleBookingAction } from '@/app/my-bookings/actions'
import { formatPrice, formatTime, formatDate, formatDuration, getCity } from '@/lib/airports'
import SeatModal from '@/components/seats/SeatModal'

type Props = {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  currentFlight: FlightRow
  onRescheduleComplete: (feeCharged: number) => void
}

type Step = 'pick-flight' | 'pick-seat' | 'confirm'

export default function RescheduleModal({
  isOpen,
  onClose,
  bookingId,
  currentFlight,
  onRescheduleComplete,
}: Props) {
  const [step, setStep] = useState<Step>('pick-flight')
  const [flights, setFlights] = useState<(FlightRow & { availableSeats: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFlight, setSelectedFlight] = useState<FlightRow | null>(null)
  const [seats, setSeats] = useState<SeatRow[]>([])
  const [selectedSeat, setSelectedSeat] = useState<SeatRow | null>(null)
  const [showSeatModal, setShowSeatModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load alternative flights
  useEffect(() => {
    if (!isOpen) return
    setStep('pick-flight')
    setSelectedFlight(null)
    setSelectedSeat(null)
    setError('')
    setLoading(true)

    getAlternativeFlights(currentFlight.origin, currentFlight.destination, currentFlight.id)
      .then(({ data, error: err }) => {
        if (err) setError(err)
        else setFlights(data ?? [])
      })
      .finally(() => setLoading(false))
  }, [isOpen, currentFlight])

  // Load seats when flight is selected
  const handleSelectFlight = useCallback(async (flight: FlightRow) => {
    setSelectedFlight(flight)
    setError('')
    setLoading(true)

    const { data, error: err } = await getSeatsForReschedule(flight.id)
    setLoading(false)

    if (err || !data) {
      setError(err || 'Failed to load seats.')
      return
    }

    setSeats(data)
    setShowSeatModal(true)
  }, [])

  const handleSeatConfirmed = useCallback((seat: SeatRow) => {
    setSelectedSeat(seat)
    setShowSeatModal(false)
    setStep('confirm')
  }, [])

  const handleConfirmReschedule = useCallback(async () => {
    if (!selectedFlight || !selectedSeat) return
    setSubmitting(true)
    setError('')

    const { data, error: err } = await rescheduleBookingAction(
      bookingId,
      selectedFlight.id,
      selectedSeat.id
    )

    setSubmitting(false)

    if (err) {
      setError(err)
      return
    }

    onRescheduleComplete(data?.feeCharged ?? 0)
  }, [bookingId, selectedFlight, selectedSeat, onRescheduleComplete])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Lock scroll
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  if (!isOpen) return null

  const newTotal = selectedFlight ? selectedFlight.base_price + (selectedSeat?.extra_fee ?? 0) : 0
  const oldTotal = currentFlight.base_price
  const fee = Math.max(0, newTotal - oldTotal)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <button
          type="button"
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          aria-label="Close"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="relative z-10 flex h-[85vh] max-h-[85vh] w-full flex-col overflow-hidden sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-xl rounded-t-xl animate-slide-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {step === 'pick-flight' ? 'Choose Alternative Flight' : step === 'confirm' ? 'Confirm Reschedule' : 'Select Seat'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {currentFlight.origin} → {currentFlight.destination}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--muted)' }}
              aria-label="Close"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="shrink-0 px-5 py-2 text-xs font-medium" style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 rounded-full" style={{ border: '2px solid var(--accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : step === 'pick-flight' ? (
              /* ─── Flight list ─── */
              flights.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>No alternative flights available on this route.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flights.map((f) => {
                    const dur = formatDuration(f.departs_at, f.arrives_at)
                    const priceDiff = f.base_price - currentFlight.base_price
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleSelectFlight(f)}
                        className="w-full text-left rounded-lg p-4 transition-all duration-150"
                        style={{ background: 'var(--background-dark)', border: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ fontFamily: 'var(--font-mono)', background: 'rgba(232,82,42,0.12)', color: 'var(--accent)' }}>
                            {f.flight_no}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(f.departs_at)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(f.departs_at)}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>{getCity(f.origin)}</p>
                          </div>
                          <div className="flex-1 text-center">
                            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{dur}</p>
                            <div className="h-px mx-2" style={{ background: 'var(--border)' }} />
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(f.arrives_at)}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>{getCity(f.destination)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{f.availableSeats} seats available</span>
                          <div className="text-right">
                            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{formatPrice(f.base_price)}</span>
                            {priceDiff > 0 && (
                              <span className="text-[10px] ml-1.5" style={{ color: 'var(--warning)' }}>+{formatPrice(priceDiff)}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            ) : step === 'confirm' && selectedFlight && selectedSeat ? (
              /* ─── Confirmation ─── */
              <div className="space-y-4">
                <div className="rounded-lg p-4" style={{ background: 'var(--background-dark)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>New Flight</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ fontFamily: 'var(--font-mono)', background: 'rgba(232,82,42,0.12)', color: 'var(--accent)' }}>
                      {selectedFlight.flight_no}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(selectedFlight.departs_at)}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(selectedFlight.departs_at)}</span>
                    <span style={{ color: 'var(--muted)' }}> → </span>
                    <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>{formatTime(selectedFlight.arrives_at)}</span>
                  </p>
                </div>

                <div className="rounded-lg p-4" style={{ background: 'var(--background-dark)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Selected Seat</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,82,42,0.12)' }}>
                      <span className="font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{selectedSeat.seat_number}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Seat {selectedSeat.seat_number}</p>
                      <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{selectedSeat.class}</p>
                    </div>
                  </div>
                </div>

                {fee > 0 && (
                  <div className="rounded-lg p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--warning)' }}>Additional fee</span>
                      <span className="text-lg font-bold" style={{ color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>{formatPrice(fee)}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>The new flight costs more than your original booking.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {step === 'confirm' && (
            <div className="shrink-0 px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { setStep('pick-flight'); setSelectedSeat(null); setSelectedFlight(null) }}
                className="btn-secondary flex-1 py-2.5"
                disabled={submitting}
              >
                Back
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={submitting}
                className="btn-primary flex-1 py-2.5"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Rescheduling…
                  </span>
                ) : (
                  fee > 0 ? `Reschedule & Pay ${formatPrice(fee)}` : 'Confirm Reschedule'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seat Modal (nested) */}
      {selectedFlight && (
        <SeatModal
          isOpen={showSeatModal}
          onClose={() => setShowSeatModal(false)}
          flight={selectedFlight}
          flightId={selectedFlight.id}
          initialSeats={seats}
          selectedClass={'economy' as SeatClass}
          onSeatConfirmed={handleSeatConfirmed}
        />
      )}
    </>
  )
}
