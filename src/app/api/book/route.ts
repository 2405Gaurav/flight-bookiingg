import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { flight_id, seat_id, total_price, full_name, passport_no, nationality, dob } = body

    // Validate required fields
    if (!flight_id || !seat_id || !total_price || !full_name || !passport_no || !nationality || !dob) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    // Call the RPC seat-lock function (atomic booking)
    const { data, error } = await supabase.rpc('lock_and_book_seat', {
      p_user_id: user.id,
      p_flight_id: flight_id,
      p_seat_id: seat_id,
      p_total_price: total_price,
      p_full_name: full_name,
      p_passport_no: passport_no,
      p_nationality: nationality,
      p_dob: dob,
    })

    if (error) {
      // Map DB exceptions to user-friendly messages
      const msg = error.message || ''
      if (msg.includes('seat_locked')) {
        return NextResponse.json(
          { error: 'Another user is reserving this seat. Please choose another.' },
          { status: 409 }
        )
      }
      if (msg.includes('seat_unavailable')) {
        return NextResponse.json(
          { error: 'This seat is already booked. Please choose another.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
    }

    const result = data?.[0]
    if (!result) {
      return NextResponse.json({ error: 'Booking failed unexpectedly.' }, { status: 500 })
    }

    return NextResponse.json({
      booking_id: result.booking_id,
      pnr_code: result.pnr_code,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
