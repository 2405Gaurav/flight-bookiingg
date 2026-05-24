'use client'

import { useEffect } from 'react'
import type { FlightRow, SeatClass, SeatRow } from '@/types/supabase'
import SeatMap from './SeatMap'

type Props = {
  isOpen: boolean
  onClose: () => void
  flight: FlightRow
  flightId: string
  initialSeats: SeatRow[]
  userBookedSeatId?: string
  selectedClass: SeatClass
  onSeatConfirmed: (seat: SeatRow) => void
}

const CLASS_LABELS: Record<SeatClass, string> = {
  first: 'First',
  business: 'Business',
  economy: 'Economy',
}

export default function SeatModal({
  isOpen,
  onClose,
  flight,
  flightId,
  initialSeats,
  userBookedSeatId,
  selectedClass,
  onSeatConfirmed,
}: Props) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        aria-label="Close seat selection"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="animate-slide-up relative z-10 flex h-[90vh] max-h-[90vh] w-full flex-col overflow-hidden sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl rounded-t-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-modal-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 id="seat-modal-title" className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Select Your Seat
          </h2>
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

        {/* Flight info bar */}
        <div className="shrink-0 px-4 py-2.5 sm:px-5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--background-dark)' }}>
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground)' }}>{flight.flight_no}</span>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span>
              {flight.origin} → {flight.destination}
            </span>
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{
                background: selectedClass === 'first' ? 'rgba(245,158,11,0.15)' : selectedClass === 'business' ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.15)',
                color: selectedClass === 'first' ? '#f59e0b' : selectedClass === 'business' ? '#8b5cf6' : '#0ea5e9',
                border: `1px solid ${selectedClass === 'first' ? 'rgba(245,158,11,0.3)' : selectedClass === 'business' ? 'rgba(139,92,246,0.3)' : 'rgba(14,165,233,0.3)'}`,
              }}
            >
              {CLASS_LABELS[selectedClass]}
            </span>
          </div>
        </div>

        {/* Seat map */}
        <div className="flex min-h-0 flex-1 flex-col">
          <SeatMap
            flightId={flightId}
            initialSeats={initialSeats}
            userBookedSeatId={userBookedSeatId}
            selectedClass={selectedClass}
            isOpen={isOpen}
            onSeatConfirmed={onSeatConfirmed}
          />
        </div>
      </div>
    </div>
  )
}
