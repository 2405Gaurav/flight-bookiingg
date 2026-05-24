'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AIRPORTS } from '@/lib/airports'
import { useFlightStore } from '@/stores/useFlightStore'

const airportCodes = Object.keys(AIRPORTS)

export default function FlightSearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setSearchQuery = useFlightStore((s) => s.setSearchQuery)

  const initial = useMemo(() => {
    const o = searchParams.get('origin') ?? ''
    const d = searchParams.get('destination') ?? ''
    const dt = searchParams.get('date') ?? ''
    const p = Number(searchParams.get('passengers') ?? '1') || 1
    return { origin: o, destination: d, date: dt, passengers: Math.min(9, Math.max(1, p)) }
  }, [searchParams])

  const [origin, setOrigin] = useState(initial.origin)
  const [destination, setDestination] = useState(initial.destination)
  const [date, setDate] = useState(initial.date)
  const [passengers, setPassengers] = useState(initial.passengers)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const today = new Date().toISOString().split('T')[0]

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!origin) errs.origin = 'Please select an origin.'
    if (!destination) errs.destination = 'Please select a destination.'
    if (origin && destination && origin === destination) {
      errs.destination = 'Destination must be different from origin.'
    }
    if (!date) {
      errs.date = 'Please select a date.'
    } else if (date < today) {
      errs.date = 'Date must be today or later.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSearchQuery({ origin, destination, date, passengerCount: passengers })
    const params = new URLSearchParams({ origin, destination, date, passengers: String(passengers) })
    router.push(`/flights?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Origin */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            From
          </label>
          <select
            id="origin-select"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value)
              if (errors.origin) setErrors((prev) => ({ ...prev, origin: '' }))
            }}
            className={`form-select ${errors.origin ? 'border-error' : ''}`}
            required
          >
            <option value="">Select origin</option>
            {airportCodes
              .filter((c) => c !== destination)
              .map((code) => (
                <option key={code} value={code}>
                  {AIRPORTS[code].city} ({code})
                </option>
              ))}
          </select>
          {errors.origin && (
            <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.origin}</p>
          )}
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            To
          </label>
          <select
            id="destination-select"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value)
              if (errors.destination) setErrors((prev) => ({ ...prev, destination: '' }))
            }}
            className={`form-select ${errors.destination ? 'border-error' : ''}`}
            required
          >
            <option value="">Select destination</option>
            {airportCodes
              .filter((c) => c !== origin)
              .map((code) => (
                <option key={code} value={code}>
                  {AIRPORTS[code].city} ({code})
                </option>
              ))}
          </select>
          {errors.destination && (
            <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.destination}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Departure Date
          </label>
          <input
            id="date-input"
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              setDate(e.target.value)
              if (errors.date) setErrors((prev) => ({ ...prev, date: '' }))
            }}
            className={`form-input ${errors.date ? 'border-error' : ''}`}
            required
          />
          {errors.date && (
            <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.date}</p>
          )}
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Passengers
          </label>
          <select
            id="passengers-select"
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="form-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'Passenger' : 'Passengers'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        id="search-flights-btn"
        type="submit"
        disabled={!origin || !destination || !date}
        className="btn-primary w-full sm:w-auto text-base py-3 px-10 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        Search Flights
      </button>
    </form>
  )
}
