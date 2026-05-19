// lib/supabase/client.ts
// Browser-side Supabase client — used in Client Components for Realtime subscriptions.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}