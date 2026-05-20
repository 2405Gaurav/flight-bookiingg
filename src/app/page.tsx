import FlightSearchForm from '@/components/flights/FlightSearchForm'

export default function HomePage() {
  return (
    <div className="hero-gradient min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float stagger-2" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14Z" />
            </svg>
            Domestic Flights Across India
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
            Explore the <span className="gradient-text">Skies</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Search, compare, and book the best flight deals.
            Your journey starts here.
          </p>
        </div>

        {/* Search card */}
        <div className="relative z-10 w-full max-w-4xl glass-card p-6 sm:p-8 animate-slide-up stagger-2">
          <FlightSearchForm />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 px-4 sm:px-6 py-10 text-center">
          {[
            { value: '6', label: 'Airports' },
            { value: '8+', label: 'Daily Flights' },
            { value: '₹2.9K', label: 'Fares From' },
            { value: '100%', label: 'Secure Booking' },
          ].map((s, i) => (
            <div key={s.label} className={`animate-slide-up stagger-${i + 1}`}>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
