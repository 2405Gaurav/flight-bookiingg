'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { BookingWithDetails, FlightRow, SeatRow } from '@/types/supabase'

// ─── getUserBookings ─────────────────────────────────────────
export async function getUserBookings(): Promise<{
  data: BookingWithDetails[] | null
  error: string | null
}> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated.' }
    }

    // Fetch bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false })

    if (bookingsError) {
      return { data: null, error: bookingsError.message }
    }

    if (!bookings || bookings.length === 0) {
      return { data: [], error: null }
    }

    // Fetch related flights
    const flightIds = [...new Set(bookings.map((b) => b.flight_id))]
    const { data: flights, error: flightsError } = await supabase
      .from('flights')
      .select('*')
      .in('id', flightIds)

    if (flightsError) {
      return { data: null, error: flightsError.message }
    }

    // Fetch related seats
    const seatIds = [...new Set(bookings.map((b) => b.seat_id))]
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .in('id', seatIds)

    if (seatsError) {
      return { data: null, error: seatsError.message }
    }

    // Fetch passengers
    const bookingIds = bookings.map((b) => b.id)
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('*')
      .in('booking_id', bookingIds)

    if (passengersError) {
      return { data: null, error: passengersError.message }
    }

    // Build lookup maps
    const flightMap = new Map((flights ?? []).map((f) => [f.id, f]))
    const seatMap = new Map((seats ?? []).map((s) => [s.id, s]))

    // Assemble BookingWithDetails
    const result: BookingWithDetails[] = bookings.map((b) => ({
      ...b,
      flight: flightMap.get(b.flight_id)!,
      seat: seatMap.get(b.seat_id)!,
      passengers: (passengers ?? []).filter((p) => p.booking_id === b.id),
    }))

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Failed to load bookings.' }
  }
}

// ─── cancelBooking ───────────────────────────────────────────
export async function cancelBookingAction(
  bookingId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated.' }
    }

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
    })

    if (error) {
      const msg = error.message || ''
      if (msg.includes('cancellation_window_closed')) {
        return { error: 'Cancellations are not allowed within 2 hours of departure.' }
      }
      if (msg.includes('already_cancelled')) {
        return { error: 'This booking is already cancelled.' }
      }
      if (msg.includes('booking_not_found')) {
        return { error: 'Booking not found or you do not own it.' }
      }
      return { error: 'Cancellation failed. Please try again.' }
    }

    return { error: null }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

// ─── getAlternativeFlights ───────────────────────────────────
export async function getAlternativeFlights(
  origin: string,
  destination: string,
  excludeFlightId: string
): Promise<{
  data: (FlightRow & { availableSeats: number })[] | null
  error: string | null
}> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: flights, error: flightsError } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .in('status', ['scheduled', 'delayed'])
      .neq('id', excludeFlightId)
      .gt('departs_at', new Date().toISOString())

    if (flightsError) {
      return { data: null, error: flightsError.message }
    }

    if (!flights || flights.length === 0) {
      return { data: [], error: null }
    }

    // Get available seat counts
    const flightIds = flights.map((f) => f.id)
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('flight_id')
      .in('flight_id', flightIds)
      .eq('is_available', true)

    if (seatsError) {
      return { data: null, error: seatsError.message }
    }

    const seatCounts = new Map<string, number>()
    for (const s of seats ?? []) {
      seatCounts.set(s.flight_id, (seatCounts.get(s.flight_id) ?? 0) + 1)
    }

    const result = flights
      .map((f) => ({
        ...f,
        availableSeats: seatCounts.get(f.id) ?? 0,
      }))
      .filter((f) => f.availableSeats > 0)

    return { data: result, error: null }
  } catch {
    return { data: null, error: 'Failed to load alternative flights.' }
  }
}

// ─── getSeatsForReschedule ───────────────────────────────────
export async function getSeatsForReschedule(
  flightId: string
): Promise<{ data: SeatRow[] | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }
    return { data: data ?? [], error: null }
  } catch {
    return { data: null, error: 'Failed to load seats.' }
  }
}

// ─── rescheduleBooking ───────────────────────────────────────
export async function rescheduleBookingAction(
  bookingId: string,
  newFlightId: string,
  newSeatId: string
): Promise<{ data: { feeCharged: number } | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'Not authenticated.' }
    }

    const { data, error } = await supabase.rpc('reschedule_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
      p_new_flight_id: newFlightId,
      p_new_seat_id: newSeatId,
    })

    if (error) {
      const msg = error.message || ''
      if (msg.includes('seat_unavailable')) {
        return { data: null, error: 'The selected seat is no longer available.' }
      }
      if (msg.includes('booking_not_found')) {
        return { data: null, error: 'Booking not found.' }
      }
      if (msg.includes('booking_cancelled')) {
        return { data: null, error: 'Cannot reschedule a cancelled booking.' }
      }
      return { data: null, error: 'Reschedule failed. Please try again.' }
    }

    const result = data?.[0]
    return {
      data: result ? { feeCharged: result.fee_charged } : { feeCharged: 0 },
      error: null,
    }
  } catch {
    return { data: null, error: 'An unexpected error occurred.' }
  }
}
