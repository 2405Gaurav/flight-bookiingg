'use client'

const CHIPS: { key: string; label: string; bg: string; border: string }[] = [
  { key: 'avail', label: 'Available', bg: 'var(--surface)', border: 'var(--border)' },
  { key: 'sel', label: 'Selected', bg: 'var(--accent)', border: 'var(--accent)' },
  { key: 'occ', label: 'Occupied', bg: 'var(--background-dark)', border: 'var(--border)' },
  { key: 'yours', label: 'Your Seat', bg: '#22c55e', border: '#16a34a' },
]

export default function SeatLegend() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
      {CHIPS.map((c) => (
        <div
          key={c.key}
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs"
          style={{ border: `1px solid var(--border)`, background: 'var(--surface)' }}
        >
          <span
            className="h-4 w-4 shrink-0 rounded"
            style={{ background: c.bg, border: `2px solid ${c.border}` }}
            aria-hidden
          />
          <span className="whitespace-nowrap font-medium" style={{ color: 'var(--secondary)' }}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}
