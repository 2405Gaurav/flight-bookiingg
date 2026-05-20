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

const CLASS_BADGE: Record<SeatClass, string> = {
  first: 'border-amber-300 bg-amber-50 text-amber-900',
  business: 'border-violet-300 bg-violet-50 text-violet-900',
  economy: 'border-sky-300 bg-sky-50 text-sky-900',
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
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close seat selection"
        onClick={onClose}
      />

      <div
        className="animate-slide-up relative z-10 flex h-[90vh] max-h-[90vh] w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
          <h2 id="seat-modal-title" className="text-lg font-semibold text-gray-900">
            Select Your Seat
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-2.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
            <span className="font-mono font-semibold">{flight.flight_no}</span>
            <span className="text-gray-400">•</span>
            <span>
              {flight.origin} → {flight.destination}
            </span>
            <span
              className={`ml-auto rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${CLASS_BADGE[selectedClass]}`}
            >
              {CLASS_LABELS[selectedClass]}
            </span>
          </div>
        </div>

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
