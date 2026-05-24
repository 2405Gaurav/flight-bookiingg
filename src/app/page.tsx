// This runs on the Next.js SERVER, not the browser

import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="bg-grid-dark min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center relative overflow-hidden">

        {/* Decorative radial glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(232,82,42,0.07) 0%, transparent 70%)' }}
          />
        </div>

        {/* Plane SVG background — top-down silhouette, tilted, right-side */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <svg
            viewBox="0 0 520 520"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute"
            style={{
              width: 'clamp(340px, 48vw, 580px)',
              right: '-6%',
              top: '50%',
              transform: 'translateY(-52%) rotate(-22deg)',
              opacity: 0.045,
            }}
          >
            {/* Fuselage */}
            <ellipse cx="260" cy="260" rx="22" ry="200" fill="white" />

            {/* Nose cone */}
            <ellipse cx="260" cy="68" rx="13" ry="30" fill="white" />

            {/* Main wings — swept back */}
            <path d="M 248 210 L 20 330 L 20 348 L 248 242 Z" fill="white" />
            <path d="M 272 210 L 500 330 L 500 348 L 272 242 Z" fill="white" />

            {/* Wing root fairings */}
            <ellipse cx="248" cy="226" rx="14" ry="30" fill="white" />
            <ellipse cx="272" cy="226" rx="14" ry="30" fill="white" />

            {/* Engine nacelles — left */}
            <rect x="82" y="308" width="60" height="18" rx="9" fill="white" />
            {/* Engine nacelles — right */}
            <rect x="378" y="308" width="60" height="18" rx="9" fill="white" />

            {/* Horizontal stabilizers */}
            <path d="M 248 418 L 148 464 L 148 476 L 248 436 Z" fill="white" />
            <path d="M 272 418 L 372 464 L 372 476 L 272 436 Z" fill="white" />

            {/* Vertical stabilizer (fin) */}
            <path d="M 252 380 L 220 418 L 300 418 L 268 380 Z" fill="white" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto mb-10 animate-slide-up">
          <div className="section-label mb-6" style={{ fontFamily: 'var(--font-mono)' }}>
            ✈ Domestic Flights Across India
          </div>

          {/* Redesigned heading — balanced two-liner */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] mb-4"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            Your Journey,{' '}
            <span className="gradient-text">Your Sky.</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
            Search, compare, and book the best flight deals.
            Your journey starts here.
          </p>
        </div>

        {user ? (
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up stagger-2">
            <Link
              href="/flights"
              className="btn-primary text-base py-3.5 px-10 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Book a Flight
            </Link>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 animate-slide-up stagger-2">
            <Link
              href="/login"
              className="btn-primary text-base py-3.5 px-10 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Login
            </Link>
            <Link
              href="/signup"
              className="btn-secondary text-base py-3.5 px-10 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
              Sign Up
            </Link>
          </div>
        )}
      </section>

      {/* Feature highlights */}
      <section style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2
            className="text-2xl font-bold text-center mb-10 animate-slide-up"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Why Choose <span className="gradient-text">SourceAsia</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                ),
                title: 'Search Flights',
                desc: 'Find the perfect flight across 6 major Indian airports with real-time availability.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                  </svg>
                ),
                title: 'Book Seats',
                desc: 'Choose from Economy, Business, or First Class with an interactive seat map.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                ),
                title: 'Manage Bookings',
                desc: 'View, reschedule, or cancel bookings anytime from your personal dashboard.',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`feature-card p-6 text-center animate-slide-up stagger-${i + 1}`}
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
                  style={{ background: 'rgba(232,82,42,0.12)', color: 'var(--accent)' }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.55 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 px-4 sm:px-6 py-10 text-center">
          {[
            { value: '6', label: 'Airports' },
            { value: '8+', label: 'Daily Flights' },
            { value: '₹2.9K', label: 'Fares From' },
            { value: '100%', label: 'Secure Booking' },
          ].map((s, i) => (
            <div key={s.label} className={`animate-slide-up stagger-${i + 1}`}>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
              <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}