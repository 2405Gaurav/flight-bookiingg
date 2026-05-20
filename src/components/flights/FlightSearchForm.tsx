'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AIRPORTS } from '@/lib/airports'

const airportCodes = Object.keys(AIRPORTS)

export default function FlightSearchForm() {
  const router = useRouter()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(1)

  // Minimum date = today
  const today = new Date().toISOString().split('T')[0]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination || !date) return
    const params = new URLSearchParams({ origin, destination, date, passengers: String(passengers) })
    router.push(`/flights?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Origin */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
            From
          </label>
          <select
            id="origin-select"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="form-select"
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
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
            To
          </label>
          <select
            id="destination-select"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="form-select"
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
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
            Departure Date
          </label>
          <input
            id="date-input"
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            required
          />
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
            Passengers
          </label>
          <select
            id="passengers-select"
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="form-select"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
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
