'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SeatClass, SeatRow } from '@/types/supabase'

const CLASS_SORT: Record<SeatClass, number> = {
  first: 0,
  business: 1,
  economy: 2,
}

function sortSeatsForDisplay(rows: SeatRow[]): SeatRow[] {
  return [...rows].sort((a, b) => {
    const byClass = CLASS_SORT[a.class] - CLASS_SORT[b.class]
    if (byClass !== 0) return byClass
    return a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true })
  })
}

/**
 * All seats for a flight, ordered first → business → economy, then seat_number ascending.
 */
export async function getSeatsForFlight(
  flightId: string
): Promise<{ data: SeatRow[] | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)

    if (error) {
      return { data: null, error: error.message }
    }
    return { data: sortSeatsForDisplay((data ?? []) as SeatRow[]), error: null }
  } catch {
    return { data: null, error: 'Failed to load seats.' }
  }
}

/**
 * Active (non-cancelled) booking seat for this user on this flight, if any.
 */
export async function getUserBookedSeat(
  flightId: string,
  userId: string
): Promise<{ data: string | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('seat_id')
      .eq('flight_id', flightId)
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .limit(1)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }
    return { data: data?.seat_id ?? null, error: null }
  } catch {
    return { data: null, error: 'Failed to check existing booking.' }
  }
}
