import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Session } from '@supabase/supabase-js'
import type { BookingWithDetails } from '@/types/supabase'

type PersistedSession = Pick<
  Session,
  'access_token' | 'refresh_token' | 'expires_in' | 'expires_at' | 'token_type'
> & {
  user: Pick<Session['user'], 'id' | 'email'>
}

interface UserStoreState {
  session: Session | null
  cachedBookings: BookingWithDetails[]
}

interface UserStoreActions {
  setSession: (session: Session | null) => void
  clearSession: () => void
  setCachedBookings: (bookings: BookingWithDetails[]) => void
}

export const useUserStore = create<UserStoreState & UserStoreActions>()(
  persist(
    (set) => ({
      session: null,
      cachedBookings: [],

      setSession: (session) => set({ session }),

      clearSession: () => set({ session: null, cachedBookings: [] }),

      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only the essential session token info, NOT the full session object
        session: (state.session
          ? ({
              access_token: state.session.access_token,
              refresh_token: state.session.refresh_token,
              expires_in: state.session.expires_in,
              expires_at: state.session.expires_at,
              token_type: state.session.token_type,
              user: {
                id: state.session.user.id,
                email: state.session.user.email,
              },
            } satisfies PersistedSession)
          : null) as unknown as Session | null,
      }),
    }
  )
)
