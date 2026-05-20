-- ============================================================
-- SEED — Flights, Seats, and Test User
-- 8 flights across 4 routes with complete seat maps
-- ============================================================

-- ─── FLIGHTS ────────────────────────────────────────────────
-- Route 1: Delhi (DEL) → Mumbai (BOM)
-- Route 2: Mumbai (BOM) → Bangalore (BLR)
-- Route 3: Delhi (DEL) → Kolkata (CCU)
-- Route 4: Chennai (MAA) → Hyderabad (HYD)

INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES
  -- Route 1: DEL → BOM
  ('11111111-0000-0000-0000-000000000001', 'FM101', 'DEL', 'BOM',
   NOW() + INTERVAL '2 days 08:00', NOW() + INTERVAL '2 days 10:00',
   'Boeing 737', 'scheduled', 4500.00),

  ('11111111-0000-0000-0000-000000000002', 'FM102', 'DEL', 'BOM',
   NOW() + INTERVAL '3 days 14:00', NOW() + INTERVAL '3 days 16:00',
   'Airbus A320', 'scheduled', 5200.00),

  -- Route 2: BOM → BLR
  ('22222222-0000-0000-0000-000000000001', 'FM201', 'BOM', 'BLR',
   NOW() + INTERVAL '2 days 09:00', NOW() + INTERVAL '2 days 10:30',
   'Boeing 737', 'scheduled', 3800.00),

  ('22222222-0000-0000-0000-000000000002', 'FM202', 'BOM', 'BLR',
   NOW() + INTERVAL '4 days 17:00', NOW() + INTERVAL '4 days 18:30',
   'Airbus A320', 'scheduled', 4100.00),

  -- Route 3: DEL → CCU
  ('33333333-0000-0000-0000-000000000001', 'FM301', 'DEL', 'CCU',
   NOW() + INTERVAL '1 day 06:00', NOW() + INTERVAL '1 day 08:30',
   'Boeing 737', 'scheduled', 5800.00),

  ('33333333-0000-0000-0000-000000000002', 'FM302', 'DEL', 'CCU',
   NOW() + INTERVAL '5 days 20:00', NOW() + INTERVAL '5 days 22:30',
   'Airbus A321', 'scheduled', 6200.00),

  -- Route 4: MAA → HYD
  ('44444444-0000-0000-0000-000000000001', 'FM401', 'MAA', 'HYD',
   NOW() + INTERVAL '2 days 11:00', NOW() + INTERVAL '2 days 12:15',
   'ATR 72', 'scheduled', 2900.00),

  ('44444444-0000-0000-0000-000000000002', 'FM402', 'MAA', 'HYD',
   NOW() + INTERVAL '6 days 15:00', NOW() + INTERVAL '6 days 16:15',
   'ATR 72', 'scheduled', 3100.00);

-- ─── SEAT MAP GENERATOR ─────────────────────────────────────
-- For each flight we create:
--   First class:  Rows 1–2,  seats A-D  (8 seats)  extra_fee = 8000
--   Business:     Rows 3–6,  seats A-F  (24 seats) extra_fee = 3000
--   Economy:      Rows 7–30, seats A-F  (144 seats) extra_fee = 0
-- Total: 176 seats per flight

DO $$
DECLARE
  flight_ids UUID[] := ARRAY[
    '11111111-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000002',
    '44444444-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000002'
  ];
  fid       UUID;
  row_num   INT;
  col       TEXT;
  cols      TEXT[] := ARRAY['A','B','C','D','E','F'];
  seat_class TEXT;
  fee       NUMERIC;
BEGIN
  FOREACH fid IN ARRAY flight_ids LOOP
    FOR row_num IN 1..30 LOOP
      -- Determine class and fee by row
      IF row_num <= 2 THEN
        seat_class := 'first';
        fee        := 8000;
        cols       := ARRAY['A','B','C','D'];        -- 4 seats per row (2-2)
      ELSIF row_num <= 6 THEN
        seat_class := 'business';
        fee        := 3000;
        cols       := ARRAY['A','B','C','D','E','F'];
      ELSE
        seat_class := 'economy';
        fee        := 0;
        cols       := ARRAY['A','B','C','D','E','F'];
      END IF;

      FOREACH col IN ARRAY cols LOOP
        INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (fid, row_num::TEXT || col, seat_class, TRUE, fee)
        ON CONFLICT (flight_id, seat_number) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- ─── MARK SOME SEATS AS ALREADY BOOKED (realistic data) ─────
-- Pre-occupy ~20% of economy seats on flight FM101
UPDATE seats
SET    is_available = FALSE
WHERE  flight_id = '11111111-0000-0000-0000-000000000001'
  AND  seat_number IN (
    '7A','7B','8C','9D','10E','11F','12A','13B',
    '14C','15D','16A','17F','18B','20C','22E'
  );

-- Pre-occupy some business on FM201
UPDATE seats
SET    is_available = FALSE
WHERE  flight_id = '22222222-0000-0000-0000-000000000001'
  AND  seat_number IN ('3A','3B','4C','5D','6E');

-- ─── TEST USER NOTE ──────────────────────────────────────────
-- Create the test user via Supabase Auth dashboard OR via:
--   supabase auth users create --email test@flightapp.dev --password Test1234!
-- Then the user can log in at /auth/login with those credentials.
-- If using the Supabase dashboard: Authentication → Users → Invite user