import { Suspense } from 'react'
import { searchFlights } from './actions'
import FlightSearchForm from '@/components/flights/FlightSearchForm'
import FlightList from '@/components/flights/FlightList'

function FlightListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex gap-3">
                <div className="skeleton h-6 w-16" />
                <div className="skeleton h-6 w-24" />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <div className="skeleton h-7 w-16" />
                  <div className="skeleton h-4 w-12" />
                </div>
                <div className="flex-1 skeleton h-px" />
                <div className="space-y-2">
                  <div className="skeleton h-7 w-16" />
                  <div className="skeleton h-4 w-12" />
                </div>
              </div>
            </div>
            <div className="sm:pl-6 space-y-3">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-8 w-24" />
              <div className="flex gap-2">
                <div className="skeleton h-7 w-16 rounded-full" />
                <div className="skeleton h-7 w-16 rounded-full" />
                <div className="skeleton h-7 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function FlightResults({
  origin,
  destination,
  date,
}: {
  origin: string
  destination: string
  date: string
}) {
  const { data, error } = await searchFlights(origin, destination, date)

  if (error) {
    return (
      <div className="rounded-xl px-4 py-3 text-sm animate-fade-in" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)' }}>
        {error}
      </div>
    )
  }

  return <FlightList flights={data ?? []} />
}

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const origin = typeof params.origin === 'string' ? params.origin : ''
  const destination = typeof params.destination === 'string' ? params.destination : ''
  const date = typeof params.date === 'string' ? params.date : ''
  const hasSearch = origin && destination && date

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Search Bar */}
        <div className="glass-card p-6 sm:p-8 mb-8 animate-fade-in">
          <h1 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <svg
              className="w-5 h-5"
              style={{ color: 'var(--accent)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            Search Flights
          </h1>
          <FlightSearchForm />
        </div>

        {/* Flight Results */}
        {hasSearch ? (
          <Suspense fallback={<FlightListSkeleton />}>
            <FlightResults origin={origin} destination={destination} date={date} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--surface)' }}>
              <svg
                className="w-10 h-10"
                style={{ color: 'var(--accent)', opacity: 0.3 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)' }}>Ready to explore?</h3>
            <p className="text-sm text-center max-w-sm" style={{ color: 'var(--muted)', opacity: 0.7 }}>
              Use the search form above to find available flights across India.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
