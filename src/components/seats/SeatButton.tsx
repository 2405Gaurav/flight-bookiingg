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

  // Determine styles
  let bg: string, border: string, color: string, cursor: string, transform = 'none', shadow = 'none'

  if (isUserSeat) {
    bg = '#22c55e'; border = '#16a34a'; color = '#fff'; cursor = 'not-allowed'
  } else if (!seat.is_available) {
    bg = 'var(--background-dark)'; border = 'var(--border)'; color = 'var(--muted)'; cursor = 'not-allowed'
  } else if (isSelected) {
    bg = 'var(--accent)'; border = 'var(--accent)'; color = '#fff'; cursor = 'pointer'
    transform = 'scale(1.05)'; shadow = '0 0 12px rgba(232,82,42,0.4)'
  } else {
    bg = 'var(--surface)'; border = 'var(--border)'; color = 'var(--secondary)'; cursor = 'pointer'
  }

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        style={{
          minHeight: '40px',
          minWidth: '36px',
          borderRadius: '6px 6px 3px 3px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          transition: 'transform 150ms, box-shadow 150ms, background 150ms',
          background: bg,
          border: `2px solid ${border}`,
          color,
          cursor,
          transform,
          boxShadow: shadow,
          opacity: !seat.is_available && !isUserSeat ? 0.5 : 1,
        }}
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
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg px-2.5 py-2 text-left text-[10px]"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{seat.seat_number}</p>
          <p style={{ color: 'var(--muted)' }}>{className}</p>
          <p style={{ color: 'var(--secondary)' }}>Extra fee: {formatExtraFee(seat.extra_fee)}</p>
          <p className="mt-0.5 font-medium">{statusLabel}</p>
        </div>
      )}
    </div>
  )
}
