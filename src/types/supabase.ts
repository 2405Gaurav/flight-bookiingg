// types/supabase.ts
// Hand-written DB types that mirror your Supabase schema.
// You can ALSO auto-generate this file with:
//   npx supabase gen types typescript --project-id <your-ref> > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FlightStatus = 'scheduled' | 'delayed' | 'cancelled' | 'completed'
export type SeatClass    = 'economy' | 'business' | 'first'
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      flights: {
        Row: {
          id:            string
          flight_no:     string
          origin:        string
          destination:   string
          departs_at:    string
          arrives_at:    string
          aircraft_type: string
          status:        FlightStatus
          base_price:    number
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['flights']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['flights']['Insert']>
      }
      seats: {
        Row: {
          id:           string
          flight_id:    string
          seat_number:  string
          class:        SeatClass
          is_available: boolean
          extra_fee:    number
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['seats']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['seats']['Insert']>
      }
      bookings: {
        Row: {
          id:          string
          user_id:     string
          flight_id:   string
          seat_id:     string
          status:      BookingStatus
          booked_at:   string
          total_price: number
          pnr_code:    string
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booked_at' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      passengers: {
        Row: {
          id:          string
          booking_id:  string
          full_name:   string
          passport_no: string
          nationality: string
          dob:         string
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['passengers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['passengers']['Insert']>
      }
      reschedules: {
        Row: {
          id:             string
          booking_id:     string
          old_flight_id:  string
          new_flight_id:  string
          requested_at:   string
          fee_charged:    number
        }
        Insert: Omit<Database['public']['Tables']['reschedules']['Row'], 'id' | 'requested_at'>
        Update: Partial<Database['public']['Tables']['reschedules']['Insert']>
      }
    }
    Functions: {
      lock_and_book_seat: {
        Args: {
          p_user_id:     string
          p_flight_id:   string
          p_seat_id:     string
          p_total_price: number
          p_full_name:   string
          p_passport_no: string
          p_nationality: string
          p_dob:         string
        }
        Returns: { booking_id: string; pnr_code: string }[]
      }
      cancel_booking: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: void
      }
      reschedule_booking: {
        Args: {
          p_booking_id:    string
          p_user_id:       string
          p_new_flight_id: string
          p_new_seat_id:   string
        }
        Returns: { fee_charged: number }[]
      }
    }
  }
}

// ─── Convenience aliases ─────────────────────────────────────
export type FlightRow     = Database['public']['Tables']['flights']['Row']
export type SeatRow       = Database['public']['Tables']['seats']['Row']
export type BookingRow    = Database['public']['Tables']['bookings']['Row']
export type PassengerRow  = Database['public']['Tables']['passengers']['Row']
export type RescheduleRow = Database['public']['Tables']['reschedules']['Row']

// ─── Enriched types used in the UI ──────────────────────────
export type BookingWithDetails = BookingRow & {
  flight:     FlightRow
  seat:       SeatRow
  passengers: PassengerRow[]
}