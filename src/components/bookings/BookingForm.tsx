'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FlightRow, SeatRow } from '@/types/supabase'
import { formatPrice } from '@/lib/airports'

type Props = {
  flight: FlightRow
  seats: SeatRow[]
}

const CLASS_ORDER = ['first', 'business', 'economy'] as const
const CLASS_COLORS: Record<string, string> = {
  first: 'border-amber-400 bg-amber-400/10 text-amber-300',
  business: 'border-violet-400 bg-violet-400/10 text-violet-300',
  economy: 'border-sky-400 bg-sky-400/10 text-sky-300',
}
const CLASS_LABELS: Record<string, string> = {
  first: 'First Class',
  business: 'Business',
  economy: 'Economy',
}

export default function BookingForm({ flight, seats }: Props) {
  const router = useRouter()
  const [selectedSeat, setSelectedSeat] = useState<SeatRow | null>(null)
  const [fullName, setFullName] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [nationality, setNationality] = useState('')
  const [dob, setDob] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Group seats by class
  const seatsByClass = CLASS_ORDER.map((cls) => ({
    class: cls,
    label: CLASS_LABELS[cls],
    seats: seats.filter((s) => s.class === cls),
  })).filter((g) => g.seats.length > 0)

  // Sort seats within each group by seat_number (row then letter)
  seatsByClass.forEach((g) => {
    g.seats.sort((a, b) => {
      const rowA = parseInt(a.seat_number)
      const rowB = parseInt(b.seat_number)
      if (rowA !== rowB) return rowA - rowB
      return a.seat_number.localeCompare(b.seat_number)
    })
  })

  const totalPrice = flight.base_price + (selectedSeat?.extra_fee ?? 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSeat) return setError('Please select a seat.')
    if (!fullName || !passportNo || !nationality || !dob)
      return setError('Please fill all passenger details.')

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight_id: flight.id,
          seat_id: selectedSeat.id,
          total_price: totalPrice,
          full_name: fullName,
          passport_no: passportNo,
          nationality,
          dob,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Booking failed. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/booking/confirmation/${data.booking_id}`)
    } catch {
      setError('Network error. Please check your connection.')
      setLoading(false)
    }
  }

  // Build grid rows for a class section
  function renderSeatGrid(classSeats: SeatRow[]) {
    // Group by row number
    const rowMap = new Map<number, SeatRow[]>()
    classSeats.forEach((s) => {
      const row = parseInt(s.seat_number)
      if (!rowMap.has(row)) rowMap.set(row, [])
      rowMap.get(row)!.push(s)
    })

    const rows = Array.from(rowMap.entries()).sort((a, b) => a[0] - b[0])
    // Determine columns from first row
    const colCount = rows[0]?.[1].length ?? 0
    const hasAisle = colCount >= 6 // A-F has aisle between C and D

    return (
      <div className="space-y-1.5">
        {rows.map(([rowNum, rowSeats]) => {
          const sorted = rowSeats.sort((a, b) => a.seat_number.localeCompare(b.seat_number))
          const left = hasAisle ? sorted.slice(0, 3) : sorted.slice(0, Math.ceil(sorted.length / 2))
          const right = hasAisle ? sorted.slice(3) : sorted.slice(Math.ceil(sorted.length / 2))

          return (
            <div key={rowNum} className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted w-5 text-right font-mono shrink-0">
                {rowNum}
              </span>
              <div className="flex gap-1">
                {left.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeat?.id === seat.id}
                    onSelect={setSelectedSeat}
                  />
                ))}
              </div>
              {/* Aisle */}
              <div className="w-4 shrink-0" />
              <div className="flex gap-1">
                {right.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeat?.id === seat.id}
                    onSelect={setSelectedSeat}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seat Selection */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
          Select Your Seat
        </h2>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-5 text-xs">
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

        <div className="glass-card p-4 sm:p-6 overflow-x-auto max-h-[420px] overflow-y-auto">
          <div className="min-w-[280px] space-y-6">
            {seatsByClass.map((group) => (
              <div key={group.class}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${CLASS_COLORS[group.class]}`}
                  >
                    {group.label}
                  </span>
                  {group.seats[0]?.extra_fee > 0 && (
                    <span className="text-[10px] text-muted">
                      +{formatPrice(group.seats[0].extra_fee)}
                    </span>
                  )}
                </div>
                {renderSeatGrid(group.seats)}
              </div>
            ))}
          </div>
        </div>

        {selectedSeat && (
          <div className="mt-3 flex items-center gap-3 text-sm animate-fade-in">
            <span className="text-muted">Selected:</span>
            <span className="font-mono font-semibold text-primary">{selectedSeat.seat_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${CLASS_COLORS[selectedSeat.class]}`}>
              {CLASS_LABELS[selectedSeat.class]}
            </span>
            {selectedSeat.extra_fee > 0 && (
              <span className="text-xs text-warning">+{formatPrice(selectedSeat.extra_fee)}</span>
            )}
          </div>
        )}
      </section>

      {/* Passenger Details */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          Passenger Details
        </h2>

        <div className="glass-card p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="passenger-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                placeholder="As on passport"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                Passport Number
              </label>
              <input
                id="passport-number"
                type="text"
                value={passportNo}
                onChange={(e) => setPassportNo(e.target.value.toUpperCase())}
                className="form-input"
                placeholder="e.g. A1234567"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                Nationality
              </label>
              <input
                id="nationality"
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="form-input"
                placeholder="e.g. Indian"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>
        </div>
      </section>

      {/* Price Summary + Submit */}
      <section className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted text-sm">Base fare</span>
          <span className="font-medium">{formatPrice(flight.base_price)}</span>
        </div>
        {selectedSeat && selectedSeat.extra_fee > 0 && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted text-sm">
              Seat upgrade ({CLASS_LABELS[selectedSeat.class]})
            </span>
            <span className="font-medium text-warning">
              +{formatPrice(selectedSeat.extra_fee)}
            </span>
          </div>
        )}
        <div className="border-t border-border pt-4 flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
        </div>
      </section>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <button
        id="confirm-booking-btn"
        type="submit"
        disabled={loading || !selectedSeat}
        className="btn-primary w-full text-base py-4"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Confirming Booking…
          </span>
        ) : (
          `Confirm & Pay ${formatPrice(totalPrice)}`
        )}
      </button>
    </form>
  )
}

/* ── Seat Button ──────────────────────────────────── */
function SeatButton({
  seat,
  isSelected,
  onSelect,
}: {
  seat: SeatRow
  isSelected: boolean
  onSelect: (s: SeatRow) => void
}) {
  const letter = seat.seat_number.replace(/\d/g, '')

  if (!seat.is_available) {
    return (
      <button
        type="button"
        disabled
        title={`${seat.seat_number} — Occupied`}
        className="w-8 h-8 rounded text-[10px] font-mono bg-surface-hover/30 border border-border text-muted/30 cursor-not-allowed"
      >
        {letter}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(seat)}
      title={`${seat.seat_number} — ${CLASS_LABELS[seat.class]}${seat.extra_fee > 0 ? ` (+${formatPrice(seat.extra_fee)})` : ''}`}
      className={`w-8 h-8 rounded text-[10px] font-mono font-medium transition-all duration-150 cursor-pointer
        ${
          isSelected
            ? 'bg-primary border border-primary text-white shadow-md shadow-primary/30 scale-110'
            : 'bg-surface border border-border-light text-secondary hover:border-primary/50 hover:bg-primary/10'
        }`}
    >
      {letter}
    </button>
  )
}
