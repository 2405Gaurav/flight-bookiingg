'use client'

import { useCallback, useId, useState } from 'react'
import type { SeatRow } from '@/types/supabase'

const CLASS_DISPLAY: Record<string, string> = {
  economy: 'Economy',
  business: 'Business',
  first: 'First',
}

function formatExtraFee(fee: number): string {
  if (fee <= 0) return 'Free'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(fee)
}

type Props = {
  seat: SeatRow
  isSelected: boolean
  isUserSeat: boolean
  onSeatClick: (seat: SeatRow) => void
}

export default function SeatButton({ seat, isSelected, isUserSeat, onSeatClick }: Props) {
  const [showTip, setShowTip] = useState(false)
  const tipId = useId()
  const letter = seat.seat_number.replace(/^\d+/, '')
  const className = CLASS_DISPLAY[seat.class] ?? seat.class

  const statusLabel = !seat.is_available
    ? isUserSeat
      ? 'Your seat'
      : 'Occupied'
    : isSelected
      ? 'Selected'
      : 'Available'

  const handleClick = useCallback(() => {
    if (!seat.is_available || isUserSeat) return
    onSeatClick(seat)
  }, [isUserSeat, onSeatClick, seat])

  let buttonClass =
    'relative min-h-[40px] min-w-[36px] rounded-t-lg rounded-b-sm text-[10px] font-mono font-semibold transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 '

  if (isUserSeat) {
    buttonClass +=
      'cursor-not-allowed bg-green-500 text-white border-2 border-green-600 opacity-100'
  } else if (!seat.is_available) {
    buttonClass += 'cursor-not-allowed bg-gray-300 opacity-60 border-2 border-gray-400 text-gray-600'
  } else if (isSelected) {
    buttonClass +=
      'scale-105 cursor-pointer bg-blue-600 text-white ring-2 ring-blue-300 border-2 border-blue-600'
  } else {
    buttonClass +=
      'cursor-pointer border-2 border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-900'
  }

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        className={buttonClass}
        onClick={handleClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        aria-describedby={showTip ? tipId : undefined}
        disabled={!seat.is_available || isUserSeat}
      >
        {letter}
      </button>
      {showTip && (
        <div
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-[10px] text-gray-800 shadow-lg"
        >
          <p className="font-mono font-bold">{seat.seat_number}</p>
          <p className="text-gray-600">{className}</p>
          <p className="text-gray-700">Extra fee: {formatExtraFee(seat.extra_fee)}</p>
          <p className="mt-0.5 font-medium text-gray-900">{statusLabel}</p>
        </div>
      )}
    </div>
  )
}
