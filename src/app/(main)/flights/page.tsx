import { createSupabaseServerClient } from '@/lib/supabase/server'
import FlightCard from '@/components/flights/FlightCard'
import FlightSearchForm from '@/components/flights/FlightSearchForm'
import { getCity } from '@/lib/airports'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Flight Results — SourceAsia',
  description: 'Browse available flights and compare fares.',
}

type Props = { searchParams: Promise<{ origin?: string; destination?: string; date?: string; passengers?: string }> }

export default async function FlightsPage({ searchParams }: Props) {
  const params = await searchParams
  const { origin, destination, date } = params

  if (!origin || !destination || !date) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Search for Flights</h1>
          <p className="text-muted mb-6">Please enter your travel details to find available flights.</p>
          <FlightSearchForm />
        </div>
      </div>
    )
  }

  const supabase = await createSupabaseServerClient()

  // Build date range for the selected day
  const dayStart = new Date(date + 'T00:00:00')
  const dayEnd = new Date(date + 'T23:59:59')

  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .gte('departs_at', dayStart.toISOString())
    .lte('departs_at', dayEnd.toISOString())
    .eq('status', 'scheduled')
    .order('departs_at', { ascending: true })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <Link href="/" className="text-sm text-muted hover:text-primary transition-colors inline-flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to search
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {getCity(origin)} → {getCity(destination)}
        </h1>
        <p className="text-muted mt-1">
          {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {params.passengers && Number(params.passengers) > 1
            ? ` · ${params.passengers} passengers`
            : ''}
        </p>
      </div>

      {/* Results */}
      {error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-error">Something went wrong fetching flights. Please try again.</p>
        </div>
      ) : !flights || flights.length === 0 ? (
        <div className="glass-card p-10 text-center animate-fade-in">
          <svg className="w-16 h-16 mx-auto text-muted/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          <h2 className="text-lg font-semibold mb-2">No Flights Found</h2>
          <p className="text-muted mb-6">
            There are no scheduled flights from {getCity(origin)} to {getCity(destination)} on this date.
          </p>
          <Link href="/" className="btn-primary inline-block py-2.5 px-6">
            Try Another Search
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted mb-2">
            {flights.length} flight{flights.length !== 1 ? 's' : ''} found
          </p>
          {flights.map((flight, i) => (
            <div key={flight.id} className={`animate-slide-up stagger-${Math.min(i + 1, 4)}`}>
              <FlightCard flight={flight} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
