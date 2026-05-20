'use client'

const CHIPS: { key: string; label: string; boxClass: string }[] = [
  { key: 'avail', label: 'Available', boxClass: 'bg-white border-2 border-gray-300' },
  { key: 'sel', label: 'Selected', boxClass: 'bg-blue-600 border-2 border-blue-600' },
  { key: 'occ', label: 'Occupied', boxClass: 'bg-gray-300 border-2 border-gray-400' },
  { key: 'yours', label: 'Your Seat', boxClass: 'bg-green-500 border-2 border-green-600' },
]

export default function SeatLegend() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
      {CHIPS.map((c) => (
        <div
          key={c.key}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-xs text-gray-800 shadow-sm"
        >
          <span className={`h-4 w-4 shrink-0 rounded ${c.boxClass}`} aria-hidden />
          <span className="whitespace-nowrap font-medium">{c.label}</span>
        </div>
      ))}
    </div>
  )
}
