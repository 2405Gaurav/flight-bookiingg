'use client'

import type { SeatRow } from '@/types/supabase'
import SeatButton from './SeatButton'

const FIRST_ROWS = [1, 2] as const
const BUSINESS_ROWS = [3, 4, 5, 6] as const
const ECONOMY_ROWS = Array.from({ length: 24 }, (_, i) => i + 7) // 7-30

function parseSeatNumber(seatNumber: string): { row: number; letter: string } | null {
  const m = seatNumber.match(/^(\d+)([A-Za-z])$/)
  if (!m) return null
  return { row: Number(m[1]), letter: m[2].toUpperCase() }
}

function buildRowMap(seats: SeatRow[]): Map<number, Map<string, SeatRow>> {
  const map = new Map<number, Map<string, SeatRow>>()
  for (const s of seats) {
    const parsed = parseSeatNumber(s.seat_number)
    if (!parsed) continue
    if (!map.has(parsed.row)) map.set(parsed.row, new Map())
    map.get(parsed.row)!.set(parsed.letter, s)
  }
  return map
}

function ZoneLabel({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide"
      style={{ background: color + '15', color, border: `1px solid ${color}30` }}
    >
      {label}
    </div>
  )
}

function ZoneDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function AircraftNose() {
  return (
    <div className="mb-4 flex justify-center" aria-hidden>
      <svg viewBox="0 0 120 40" className="h-10 w-32" style={{ color: 'var(--muted)' }} fill="currentColor">
        <path d="M60 4 C20 4 8 20 8 28 L8 36 L112 36 L112 28 C112 20 100 4 60 4 Z" opacity="0.2" />
        <path
          d="M60 8 C32 8 16 18 12 30 L108 30 C104 18 88 8 60 8 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  )
}

function SeatRowBlock({
  rowNum,
  letters,
  rowMap,
  selectedSeatId,
  userBookedSeatId,
  onSeatClick,
}: {
  rowNum: number
  letters: readonly string[]
  rowMap: Map<number, Map<string, SeatRow>>
  selectedSeatId: string | null
  userBookedSeatId?: string
  onSeatClick: (seat: SeatRow) => void
}) {
  const row = rowMap.get(rowNum)
  const splitAt = 3
  const left = letters.slice(0, splitAt)
  const right = letters.slice(splitAt)

  return (
    <div className="flex min-h-[44px] items-center gap-2 sm:gap-3">
      <span className="w-7 shrink-0 text-right text-[11px] font-semibold sm:w-8" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
        {rowNum}
      </span>
      <div className="flex gap-1.5 sm:gap-2">
        {left.map((L) => {
          const seat = row?.get(L)
          if (!seat) {
            return (
              <div key={L} className="min-h-[40px] min-w-[36px]" aria-hidden />
            )
          }
          const isUserSeat = userBookedSeatId === seat.id
          return (
            <SeatButton
              key={seat.id}
              seat={seat}
              isSelected={selectedSeatId === seat.id}
              isUserSeat={isUserSeat}
              onSeatClick={onSeatClick}
            />
          )
        })}
      </div>
      <div className="min-w-[12px] shrink-0" aria-hidden />
      <div className="flex gap-1.5 sm:gap-2">
        {right.map((L) => {
          const seat = row?.get(L)
          if (!seat) {
            return (
              <div key={L} className="min-h-[40px] min-w-[36px]" aria-hidden />
            )
          }
          const isUserSeat = userBookedSeatId === seat.id
          return (
            <SeatButton
              key={seat.id}
              seat={seat}
              isSelected={selectedSeatId === seat.id}
              isUserSeat={isUserSeat}
              onSeatClick={onSeatClick}
            />
          )
        })}
      </div>
    </div>
  )
}

type Props = {
  seats: SeatRow[]
  selectedSeatId: string | null
  userBookedSeatId?: string
  onSeatClick: (seat: SeatRow) => void
}

export default function CabinGrid({
  seats,
  selectedSeatId,
  userBookedSeatId,
  onSeatClick,
}: Props) {
  const rowMap = buildRowMap(seats)

  const firstLetters = ['A', 'B', 'C', 'D'] as const
  const wideLetters = ['A', 'B', 'C', 'D', 'E', 'F'] as const

  return (
    <div className="max-h-[70vh] overflow-y-auto px-4 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* First */}
      <div className="mb-6">
        <ZoneLabel label="FIRST CLASS" color="#f59e0b" />
        <AircraftNose />
        <div className="space-y-2">
          {FIRST_ROWS.map((r) => (
            <SeatRowBlock
              key={r}
              rowNum={r}
              letters={firstLetters}
              rowMap={rowMap}
              selectedSeatId={selectedSeatId}
              userBookedSeatId={userBookedSeatId}
              onSeatClick={onSeatClick}
            />
          ))}
        </div>
      </div>

      <ZoneDivider label="BUSINESS CLASS" />

      <div className="mb-6">
        <div className="mb-3 hidden sm:block">
          <ZoneLabel label="BUSINESS CLASS" color="#8b5cf6" />
        </div>
        <div className="space-y-2">
          {BUSINESS_ROWS.map((r) => (
            <SeatRowBlock
              key={r}
              rowNum={r}
              letters={wideLetters}
              rowMap={rowMap}
              selectedSeatId={selectedSeatId}
              userBookedSeatId={userBookedSeatId}
              onSeatClick={onSeatClick}
            />
          ))}
        </div>
      </div>

      <ZoneDivider label="ECONOMY CLASS" />

      <div className="mb-6">
        <div className="mb-3 hidden sm:block">
          <ZoneLabel label="ECONOMY CLASS" color="#0ea5e9" />
        </div>
        <div className="space-y-2">
          {ECONOMY_ROWS.map((r) => (
            <SeatRowBlock
              key={r}
              rowNum={r}
              letters={wideLetters}
              rowMap={rowMap}
              selectedSeatId={selectedSeatId}
              userBookedSeatId={userBookedSeatId}
              onSeatClick={onSeatClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
