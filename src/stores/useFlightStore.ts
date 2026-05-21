import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { FlightRow, SeatRow } from '@/types/supabase'
// The Persist middleware enables you to store your Zustand state in a storage 
//(e.g., localStorage, AsyncStorage, IndexedDB, etc.), thus persisting its data.

export interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengerCount: number
}

export interface PassengerForm {
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}

export interface BookingResult {
  bookingId: string
  pnrCode: string
}

export type BookingStep = 'search' | 'select-seat' | 'passenger-form' | 'confirmation'

interface FlightStoreState {
  searchQuery: SearchQuery
  selectedFlight: FlightRow | null
  selectedSeat: SeatRow | null
  currentStep: BookingStep
  passengerForm: PassengerForm
  bookingResult: BookingResult | null
}

interface FlightStoreActions {
  setSearchQuery: (query: Partial<SearchQuery>) => void
  setSelectedFlight: (flight: FlightRow | null) => void
  setSelectedSeat: (seat: SeatRow | null) => void
  setCurrentStep: (step: BookingStep) => void
  setPassengerForm: (form: Partial<PassengerForm>) => void
  setBookingResult: (result: BookingResult | null) => void
  resetStore: () => void
}

const initialState: FlightStoreState = {
  searchQuery: {
    origin: '',
    destination: '',
    date: '',
    passengerCount: 1,
  },
  selectedFlight: null,
  selectedSeat: null,
  currentStep: 'search',
  passengerForm: {
    fullName: '',
    passportNo: '',
    nationality: '',
    dob: '',
  },
  bookingResult: null,
}

export const useFlightStore = create<FlightStoreState & FlightStoreActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSearchQuery: (query) =>
        set((state) => ({
          searchQuery: { ...state.searchQuery, ...query },
        })),

      setSelectedFlight: (flight) =>
        set({ selectedFlight: flight }),

      setSelectedSeat: (seat) =>
        set({ selectedSeat: seat }),

      setCurrentStep: (step) =>
        set({ currentStep: step }),

      setPassengerForm: (form) =>
        set((state) => ({
          passengerForm: { ...state.passengerForm, ...form },
        })),

      setBookingResult: (result) =>
        set({ bookingResult: result }),

      resetStore: () => set(initialState),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        currentStep: state.currentStep,
        passengerForm: {
          fullName: state.passengerForm.fullName,
          // EXCLUDE passportNo from localStorage (sensitive data)
          passportNo: '',
          nationality: state.passengerForm.nationality,
          dob: state.passengerForm.dob,
        },
        bookingResult: state.bookingResult,
      }),
    }
  )
)
