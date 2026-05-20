'use client'

import { useState, useEffect } from 'react'
import type { SeatRow, SeatClass } from '@/types/supabase'
import { formatPrice } from '@/lib/airports'

type Props = {
  seats: SeatRow[]
  selectedClass: SeatClass
  onSelect: (seat: SeatRow) => void
  onClose: () => void
}

const CLASS_LABELS: Record<string, string> = {
  first: 'First Class',
  business: 'Business',
  economy: 'Economy',
}

const CLASS_COLORS: Record<string, string> = {
  first: 'border-amber-400 bg-amber-400/10 text-amber-300',
  business: 'border-violet-400 bg-violet-400/10 text-violet-300',
  economy: 'border-sky-400 bg-sky-400/10 text-sky-300',
}

const CLASS_ORDER: SeatClass[] = ['first', 'business', 'economy']

// Row ranges by class
const CLASS_ROWS: Record<SeatClass, [number, number]> = {
  first: [1, 2],
  business: [3, 6],
  economy: [7, 30],
}

export default function SeatModal({ seats, selectedClass, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState<SeatRow | null>(null)
  const [activeTab, setActiveTab] = useState<SeatClass>(selectedClass)
  const [tooltip, setTooltip] = useState<{ seat: SeatRow; x: number; y: number } | null>(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Group seats by class
  const seatsByClass = CLASS_ORDER.map((cls) => ({
    class: cls,
    label: CLASS_LABELS[cls],
    rows: CLASS_ROWS[cls],
    seats: seats.filter((s) => s.class === cls),
  })).filter((g) => g.seats.length > 0)

  // Build seat grid for a class section
  function renderSeatGrid(classSeats: SeatRow[]) {
    const rowMap = new Map<number, SeatRow[]>()
    classSeats.forEach((s) => {
      const row = parseInt(s.seat_number)
      if (!rowMap.has(row)) rowMap.set(row, [])
      rowMap.get(row)!.push(s)
    })

    const rows = Array.from(rowMap.entries()).sort((a, b) => a[0] - b[0])
    const colCount = rows[0]?.[1].length ?? 0
    const hasAisle = colCount >= 6

    return (
      <div className="space-y-2">
        {/* Column headers */}
        <div className="flex items-center gap-1.5 ml-7">
          <div className="flex gap-1">
            {(hasAisle ? ['A', 'B', 'C'] : ['A', 'B', 'C'].slice(0, Math.ceil(colCount / 2))).map(
              (c) => (
                <span key={c} className="w-10 h-6 flex items-center justify-center text-[10px] text-muted font-mono">
                  {c}
                </span>
              )
            )}
          </div>
          <div className="w-6 shrink-0" />
          <div className="flex gap-1">
            {(hasAisle ? ['D', 'E', 'F'] : ['D', 'E', 'F'].slice(0, colCount - Math.ceil(colCount / 2))).map(
              (c) => (
                <span key={c} className="w-10 h-6 flex items-center justify-center text-[10px] text-muted font-mono">
                  {c}
                </span>
              )
            )}
          </div>
        </div>

        {rows.map(([rowNum, rowSeats]) => {
          const sorted = rowSeats.sort((a, b) => a.seat_number.localeCompare(b.seat_number))
          const left = hasAisle ? sorted.slice(0, 3) : sorted.slice(0, Math.ceil(sorted.length / 2))
          const right = hasAisle ? sorted.slice(3) : sorted.slice(Math.ceil(sorted.length / 2))

          return (
            <div key={rowNum} className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted w-6 text-right font-mono shrink-0">
                {rowNum}
              </span>
              <div className="flex gap-1">
                {left.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selected?.id === seat.id}
                    onSelect={setSelected}
                    onHover={(seat, e) => setTooltip({ seat, x: e.clientX, y: e.clientY })}
                    onLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
              {/* Aisle */}
              <div className="w-6 shrink-0 flex items-center justify-center">
                <div className="w-px h-6 bg-border" />
              </div>
              <div className="flex gap-1">
                {right.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selected?.id === seat.id}
                    onSelect={setSelected}
                    onHover={(seat, e) => setTooltip({ seat, x: e.clientX, y: e.clientY })}
                    onLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const activeGroup = seatsByClass.find((g) => g.class === activeTab)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-background border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col animate-slide-up z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
            Select Your Seat
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors text-muted hover:text-foreground"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Class tabs */}
        <div className="flex border-b border-border shrink-0">
          {seatsByClass.map((group) => (
            <button
              key={group.class}
              onClick={() => setActiveTab(group.class as SeatClass)}
              className={`flex-1 text-xs font-medium py-3 transition-colors relative ${
                activeTab === group.class
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                activeTab === group.class ? CLASS_COLORS[group.class] : 'border-transparent'
              }`}>
                {group.label}
                <span className="text-[10px] opacity-60">
                  (Rows {group.rows[0]}-{group.rows[1]})
                </span>
              </span>
              {activeTab === group.class && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-5 py-3 border-b border-border text-xs shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border border-border-light bg-surface" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-primary border border-primary" />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-surface-hover/50 border border-border opacity-40" />
            Occupied
          </span>
        </div>

        {/* Seat grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {activeGroup && renderSeatGrid(activeGroup.seats)}
        </div>

        {/* Footer: selected seat info + confirm */}
        <div className="border-t border-border px-5 py-4 shrink-0">
          {selected ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-primary text-lg">
                  {selected.seat_number}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded border ${CLASS_COLORS[selected.class]}`}>
                  {CLASS_LABELS[selected.class]}
                </span>
                {selected.extra_fee > 0 && (
                  <span className="text-xs text-warning">
                    +{formatPrice(selected.extra_fee)}
                  </span>
                )}
              </div>
              <button
                onClick={() => onSelect(selected)}
                className="btn-primary text-sm py-2.5 px-6"
              >
                Confirm Seat
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted text-center">
              Tap a seat to select it
            </p>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[60] pointer-events-none bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <p className="font-mono font-semibold">{tooltip.seat.seat_number}</p>
          <p className="text-muted">{CLASS_LABELS[tooltip.seat.class]}</p>
          {tooltip.seat.extra_fee > 0 && (
            <p className="text-warning">+{formatPrice(tooltip.seat.extra_fee)}</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Seat Button ──────────────────────────────────── */
function SeatButton({
  seat,
  isSelected,
  onSelect,
  onHover,
  onLeave,
}: {
  seat: SeatRow
  isSelected: boolean
  onSelect: (s: SeatRow) => void
  onHover: (s: SeatRow, e: React.MouseEvent) => void
  onLeave: () => void
}) {
  const letter = seat.seat_number.replace(/\d/g, '')

  if (!seat.is_available) {
    return (
      <button
        type="button"
        disabled
        title={`${seat.seat_number} — Occupied`}
        className="w-10 h-10 rounded-lg text-[11px] font-mono bg-surface-hover/30 border border-border text-muted/30 cursor-not-allowed flex items-center justify-center"
      >
        {letter}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(seat)}
      onMouseEnter={(e) => onHover(seat, e)}
      onMouseLeave={onLeave}
      className={`w-10 h-10 rounded-lg text-[11px] font-mono font-medium transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5
        ${
          isSelected
            ? 'bg-primary border border-primary text-white shadow-md shadow-primary/30 scale-105'
            : 'bg-surface border border-border-light text-secondary hover:border-primary/50 hover:bg-primary/10'
        }`}
      style={{ minWidth: '40px', minHeight: '40px' }}
    >
      <span>{letter}</span>
      {seat.extra_fee > 0 && (
        <span className={`text-[7px] leading-none ${isSelected ? 'text-white/70' : 'text-muted/60'}`}>
          +{Math.round(seat.extra_fee / 100)}
        </span>
      )}
    </button>
  )
}
