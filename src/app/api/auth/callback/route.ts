import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    console.log(code)

    if (code) {
        const supabase = await createSupabaseServerClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    return NextResponse.redirect(`${origin}/`)
}

// Is It Called Automatically?Yes — but only for OAuth logins (Google, GitHub etc.) and magic link / email confirmation flows.
//  For ourr current email+password login it is never called.
// Email + Password login (what you're using now):
// ────────────────────────────────────────────────
// Browser → supabase.auth.signInWithPassword()
//         → Supabase returns session directly
//         → NO redirect, NO callback
//         → this file is NEVER touched

// OAuth / Magic Link login (if you add it later):
// ────────────────────────────────────────────────
// Browser → supabase.auth.signInWithOAuth({ provider: 'google' })
//         → redirects to Google login page
//         → Google redirects back to YOUR app with a ?code=xxx
//         → lands on /api/auth/callback?code=abc123
//         → THIS FILE runs
//         → exchanges code for session
//         → redirects to /