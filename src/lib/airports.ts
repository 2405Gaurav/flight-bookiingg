// Airport IATA code → city name and full airport name
export const AIRPORTS: Record<string, { city: string; name: string }> = {
  DEL: { city: 'New Delhi', name: 'Indira Gandhi International' },
  BOM: { city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International' },
  BLR: { city: 'Bengaluru', name: 'Kempegowda International' },
  CCU: { city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International' },
  MAA: { city: 'Chennai', name: 'Chennai International' },
  HYD: { city: 'Hyderabad', name: 'Rajiv Gandhi International' },
}

export function getCity(code: string) {
  return AIRPORTS[code]?.city ?? code
}

export function getAirportLabel(code: string) {
  const a = AIRPORTS[code]
  return a ? `${a.city} (${code})` : code
}

export function formatDuration(departs: string, arrives: string): string {
  const ms = new Date(arrives).getTime() - new Date(departs).getTime()
  const h = Math.floor(ms / 3_600_000)
  const m = Math.round((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
