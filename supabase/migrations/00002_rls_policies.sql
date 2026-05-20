-- ============================================================
-- MIGRATION 002 — Row Level Security Policies
-- ============================================================

-- ─── ENABLE RLS ON ALL TABLES ───────────────────────────────
ALTER TABLE flights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- ─── FLIGHTS (public read, no write from client) ─────────────
CREATE POLICY "flights_public_read"
  ON flights FOR SELECT
  USING (true);

-- ─── SEATS (public read for availability, no direct write) ───
CREATE POLICY "seats_public_read"
  ON seats FOR SELECT
  USING (true);

-- ─── BOOKINGS ────────────────────────────────────────────────
-- Users can only see their own bookings
CREATE POLICY "bookings_select_own"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert bookings for themselves
CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own bookings (reschedule / cancel)
CREATE POLICY "bookings_update_own"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── PASSENGERS ──────────────────────────────────────────────
-- Passengers belong to a booking — only the booking owner can access
CREATE POLICY "passengers_select_own"
  ON passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = passengers.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "passengers_insert_own"
  ON passengers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = passengers.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- ─── RESCHEDULES ─────────────────────────────────────────────
CREATE POLICY "reschedules_select_own"
  ON reschedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reschedules.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "reschedules_insert_own"
  ON reschedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reschedules.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- ─── ENABLE REALTIME on seats ────────────────────────────────
-- Run this in Supabase Dashboard → Database → Replication
-- or via the Supabase CLI:
-- supabase db push  (picks up publications automatically if using CLI)
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;