'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { FlightRow, SeatRow, SeatClass } from '@/types/supabase'

// ─── Enriched return types ──────────────────────────────────
export type FlightWithAvailability = FlightRow & {
  economyAvailable: number
  businessAvailable: number
  firstAvailable: number
}

export type FlightWithSeats = FlightRow & {
  seats: SeatRow[]
}

// ─── searchFlights ──────────────────────────────────────────
export async function searchFlights(
  origin: string,
  destination: string,
  date: string
): Promise<{ data: FlightWithAvailability[] | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Fetch flights matching origin, destination, and date
    const { data: flights, error: flightError } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', origin.toUpperCase())
      .eq('destination', destination.toUpperCase())
      .in('status', ['scheduled', 'delayed'])

    if (flightError) {
      return { data: null, error: flightError.message }
    }

    if (!flights || flights.length === 0) {
      return { data: [], error: null }
    }

    // Filter by date (compare departs_at date part)
    const dateFiltered = flights.filter((f) => {
      const departDate = f.departs_at.split('T')[0]
      return departDate === date
    })

    if (dateFiltered.length === 0) {
      return { data: [], error: null }
    }

    // For each flight, get available seat counts per class
    const flightIds = dateFiltered.map((f) => f.id)
    const { data: seats, error: seatError } = await supabase
      .from('seats')
      .select('flight_id, class, is_available')
      .in('flight_id', flightIds)
      .eq('is_available', true)

    if (seatError) {
      return { data: null, error: seatError.message }
    }

    // Count available seats per flight per class
    const seatCounts = new Map<string, { economy: number; business: number; first: number }>()
    for (const seat of seats ?? []) {
      if (!seatCounts.has(seat.flight_id)) {
        seatCounts.set(seat.flight_id, { economy: 0, business: 0, first: 0 })
      }
      const counts = seatCounts.get(seat.flight_id)!
      const seatClass = seat.class as SeatClass
      if (seatClass === 'economy') counts.economy++
      else if (seatClass === 'business') counts.business++
      else if (seatClass === 'first') counts.first++
    }

    const enrichedFlights: FlightWithAvailability[] = dateFiltered.map((flight) => {
      const counts = seatCounts.get(flight.id) ?? { economy: 0, business: 0, first: 0 }
      return {
        ...flight,
        economyAvailable: counts.economy,
        businessAvailable: counts.business,
        firstAvailable: counts.first,
      }
    })

    return { data: enrichedFlights, error: null }
  } catch {
    return { data: null, error: 'An unexpected error occurred while searching flights.' }
  }
}

// ─── getFlightById ──────────────────────────────────────────
export async function getFlightById(
  flightId: string
): Promise<{ data: FlightWithSeats | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Fetch the flight
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select('*')
      .eq('id', flightId)
      .single()

    if (flightError) {
      return { data: null, error: flightError.message }
    }

    // Fetch all seats for this flight
    const { data: seats, error: seatError } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number', { ascending: true })

    if (seatError) {
      return { data: null, error: seatError.message }
    }

    return {
      data: {
        ...flight,
        seats: seats ?? [],
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'An unexpected error occurred while fetching flight details.' }
  }
}

// ─── bookFlight ─────────────────────────────────────────────
export async function bookFlight(params: {
  flightId: string
  seatId: string
  totalPrice: number
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}): Promise<{ data: { bookingId: string; pnrCode: string } | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to book a flight.' }
    }

    // Call the RPC seat-lock function (atomic booking)
    const { data, error } = await supabase.rpc('lock_and_book_seat', {
      p_user_id: user.id,
      p_flight_id: params.flightId,
      p_seat_id: params.seatId,
      p_total_price: params.totalPrice,
      p_full_name: params.fullName,
      p_passport_no: params.passportNo,
      p_nationality: params.nationality,
      p_dob: params.dob,
    })

    if (error) {
      const msg = error.message || ''
      if (msg.includes('seat_locked')) {
        return {
          data: null,
          error: 'Another user is reserving this seat. Please choose another.',
        }
      }
      if (msg.includes('seat_unavailable')) {
        return {
          data: null,
          error: 'This seat is already booked. Please choose another.',
        }
      }
      return { data: null, error: 'Booking failed. Please try again.' }
    }

    const result = data?.[0]
    if (!result) {
      return { data: null, error: 'Booking failed unexpectedly.' }
    }

    return {
      data: {
        bookingId: result.booking_id,
        pnrCode: result.pnr_code,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'An unexpected error occurred during booking.' }
  }
}
