-- ============================================================
-- MIGRATION 001 — Initial Schema
-- Flight Management App
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── FLIGHTS ────────────────────────────────────────────────
CREATE TABLE flights (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_no     TEXT NOT NULL UNIQUE,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  departs_at    TIMESTAMPTZ NOT NULL,
  arrives_at    TIMESTAMPTZ NOT NULL,
  aircraft_type TEXT NOT NULL DEFAULT 'Boeing 737',
  status        TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'delayed', 'cancelled', 'completed')),
  base_price    NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEATS ──────────────────────────────────────────────────
CREATE TABLE seats (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_id     UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_number   TEXT NOT NULL,                         -- e.g. "1A", "14C"
  class         TEXT NOT NULL
                  CHECK (class IN ('economy', 'business', 'first')),
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  extra_fee     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (flight_id, seat_number)
);

-- ─── BOOKINGS ───────────────────────────────────────────────
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id     UUID NOT NULL REFERENCES flights(id),
  seat_id       UUID NOT NULL REFERENCES seats(id),
  status        TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed', 'rescheduled', 'cancelled')),
  booked_at     TIMESTAMPTZ DEFAULT NOW(),
  total_price   NUMERIC(10, 2) NOT NULL,
  pnr_code      TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PASSENGERS ─────────────────────────────────────────────
CREATE TABLE passengers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  passport_no   TEXT NOT NULL,
  nationality   TEXT NOT NULL,
  dob           DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESCHEDULES ────────────────────────────────────────────
CREATE TABLE reschedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_flight_id   UUID NOT NULL REFERENCES flights(id),
  new_flight_id   UUID NOT NULL REFERENCES flights(id),
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  fee_charged     NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX idx_flights_origin_dest   ON flights(origin, destination);
CREATE INDEX idx_flights_departs_at    ON flights(departs_at);
CREATE INDEX idx_seats_flight_id       ON seats(flight_id);
CREATE INDEX idx_bookings_user_id      ON bookings(user_id);
CREATE INDEX idx_bookings_flight_id    ON bookings(flight_id);
CREATE INDEX idx_passengers_booking_id ON passengers(booking_id);