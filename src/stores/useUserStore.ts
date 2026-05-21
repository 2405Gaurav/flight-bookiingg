import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
// The Persist middleware enables you to store your Zustand state in a storage 
//(e.g., localStorage, AsyncStorage, IndexedDB, etc.), thus persisting its data.
import type { Session } from '@supabase/supabase-js'
// Session — the full session object from Supabase auth when the users looggs in 
import type { BookingWithDetails } from '@/types/supabase'

type PersistedSession = Pick<
  Session,
  'access_token' | 'refresh_token' | 'expires_in' | 'expires_at' | 'token_type'
> & {
  user: Pick<Session['user'], 'id' | 'email'>
}

// we creates a smaller TYPE and only got the limited information fomr the session,Because localStorage is readable by any JavaScript on your page. You only store what you actually need.

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
// Replaces the entire session in the store. Called right after login succeeds.

      clearSession: () => set({ session: null, cachedBookings: [] }),
// Wipes everything on logout. Bookings are cleared too — you don't want cached bookings showing after logout.

      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
// Saves bookings to the store after fetching from DB. Used by the My Bookings page so data is readable offline.
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // Tells persist to use localStorage. The () => lazy wrapper prevents errors during SSR — 
      // localStorage doesn't exist on the server, so wrapping it in a function means it only gets accessed in the browser.
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





// import {create} from 'zustand'
// // create is how you make a Zustand store — a global state container any component can read/write without prop drilling.
// import { createJSONStorage,persist } from 'zustand/middleware'
// //now the persist is a wrapper that automatically saves the zustand store to "localStorage", whenever state changes 
// //and restores it when the app loads and createJSONStorage tells it HOW to store — convert state to JSON string for localStorage.
// import { Session } from '@supabase/supabase-js'
// import { BookingWithDetails } from '@/types/supabase'
// // the supabase sesssion contains the information like access token,refreshe tokes,expires it and expiresat,then user information as well id,email,phone...

// type PersistedSession = Pick
//   Session,
//   'access_token' | 'refresh_token' | 'expires_in' | 'expires_at' | 'token_type'
// > & {
//   user: Pick<Session['user'], 'id' | 'email'>
// }

// interface UserStoreState{
//   session: session | null
//   cachedBookings: BookingWithDetails[]//stores for offline reading 
// }
// interface UserStoreActions {
//   setSession: (session: Session | null) => void  // called after login
//   clearSession: () => void                        // called on logout
//   setCachedBookings: (bookings: BookingWithDetails[]) => void
// }

// export const useUserState= create<UserStoreState & UserStoreActions>()(
//   // create<T>()() — the double ()() is because persist is a middleware wrapper. The type combines state + actions so TypeScript knows everything in one go.


// )