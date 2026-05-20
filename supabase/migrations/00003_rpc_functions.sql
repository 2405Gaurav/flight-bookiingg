-- ============================================================
-- MIGRATION 003 — RPC Functions
-- seat_lock, cancel_booking, and 2-hour cancellation trigger
-- ============================================================

-- ─── FUNCTION: lock_and_book_seat ────────────────────────────
-- Atomically reserves a seat and creates a booking.
-- Prevents double-booking using FOR UPDATE SKIP LOCKED.
-- Returns the new booking id and pnr_code.
CREATE OR REPLACE FUNCTION lock_and_book_seat(
  p_user_id     UUID,
  p_flight_id   UUID,
  p_seat_id     UUID,
  p_total_price NUMERIC,
  p_full_name   TEXT,
  p_passport_no TEXT,
  p_nationality TEXT,
  p_dob         DATE
)
RETURNS TABLE (booking_id UUID, pnr_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as DB owner, bypasses RLS for atomic write
AS $$
DECLARE
  v_seat_available BOOLEAN;
  v_booking_id     UUID;
  v_pnr            TEXT;
BEGIN
  -- 1. Lock the seat row — SKIP LOCKED means concurrent calls fail fast
  SELECT is_available
  INTO   v_seat_available
  FROM   seats
  WHERE  id = p_seat_id
    AND  flight_id = p_flight_id
  FOR UPDATE SKIP LOCKED;   -- raises exception if another tx holds the lock

  -- 2. If we couldn't get the lock, seat is being booked concurrently
  IF NOT FOUND THEN
    RAISE EXCEPTION 'seat_locked'
      USING HINT = 'Another user is reserving this seat. Please choose another.';
  END IF;

  -- 3. If seat is already taken
  IF NOT v_seat_available THEN
    RAISE EXCEPTION 'seat_unavailable'
      USING HINT = 'This seat is already booked. Please choose another.';
  END IF;

  -- 4. Mark seat as unavailable
  UPDATE seats
  SET    is_available = FALSE
  WHERE  id = p_seat_id;

  -- 5. Generate PNR (8-char uppercase alphanumeric)
  v_pnr := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
  -- Remove non-alphanumeric chars
  v_pnr := regexp_replace(v_pnr, '[^A-Z0-9]', 'X', 'g');

  -- 6. Insert booking
  INSERT INTO bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price, v_pnr)
  RETURNING id INTO v_booking_id;

  -- 7. Insert passenger details
  INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
  VALUES (v_booking_id, p_full_name, p_passport_no, p_nationality, p_dob);

  -- 8. Return result
  RETURN QUERY SELECT v_booking_id, v_pnr;
END;
$$;

-- ─── FUNCTION: cancel_booking ────────────────────────────────
-- Atomically cancels a booking and frees the seat.
-- The 2-hour rule is enforced here AND via trigger below.
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_user_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_flight_id   UUID;
  v_seat_id     UUID;
  v_departs_at  TIMESTAMPTZ;
  v_status      TEXT;
BEGIN
  -- 1. Fetch booking with lock
  SELECT b.flight_id, b.seat_id, b.status, f.departs_at
  INTO   v_flight_id, v_seat_id, v_status, v_departs_at
  FROM   bookings b
  JOIN   flights f ON f.id = b.flight_id
  WHERE  b.id = p_booking_id
    AND  b.user_id = p_user_id    -- ownership check
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found'
      USING HINT = 'Booking does not exist or you do not own it.';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'already_cancelled'
      USING HINT = 'This booking is already cancelled.';
  END IF;

  -- 2. 2-hour rule: reject if departure is within 2 hours
  IF v_departs_at - NOW() < INTERVAL '2 hours' THEN
    RAISE EXCEPTION 'cancellation_window_closed'
      USING HINT = 'Cancellations are not allowed within 2 hours of departure.';
  END IF;

  -- 3. Free the seat
  UPDATE seats
  SET    is_available = TRUE
  WHERE  id = v_seat_id;

  -- 4. Mark booking as cancelled
  UPDATE bookings
  SET    status = 'cancelled'
  WHERE  id = p_booking_id;
END;
$$;

-- ─── FUNCTION: reschedule_booking ────────────────────────────
-- Moves a booking to a new flight on the same route.
-- Charges a fee if the new flight is more expensive.
CREATE OR REPLACE FUNCTION reschedule_booking(
  p_booking_id    UUID,
  p_user_id       UUID,
  p_new_flight_id UUID,
  p_new_seat_id   UUID
)
RETURNS TABLE (fee_charged NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_flight_id  UUID;
  v_old_seat_id    UUID;
  v_old_price      NUMERIC;
  v_new_base_price NUMERIC;
  v_new_seat_fee   NUMERIC;
  v_new_total      NUMERIC;
  v_fee            NUMERIC := 0;
  v_status         TEXT;
  v_new_available  BOOLEAN;
BEGIN
  -- 1. Fetch existing booking
  SELECT b.flight_id, b.seat_id, b.total_price, b.status
  INTO   v_old_flight_id, v_old_seat_id, v_old_price, v_status
  FROM   bookings b
  WHERE  b.id = p_booking_id
    AND  b.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'booking_cancelled'
      USING HINT = 'Cannot reschedule a cancelled booking.';
  END IF;

  -- 2. Check new seat availability
  SELECT is_available
  INTO   v_new_available
  FROM   seats
  WHERE  id = p_new_seat_id
    AND  flight_id = p_new_flight_id
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND OR NOT v_new_available THEN
    RAISE EXCEPTION 'seat_unavailable'
      USING HINT = 'The selected seat on the new flight is not available.';
  END IF;

  -- 3. Calculate new total and fee
  SELECT base_price INTO v_new_base_price FROM flights WHERE id = p_new_flight_id;
  SELECT extra_fee  INTO v_new_seat_fee   FROM seats   WHERE id = p_new_seat_id;
  v_new_total := v_new_base_price + v_new_seat_fee;

  IF v_new_total > v_old_price THEN
    v_fee := v_new_total - v_old_price;
  END IF;

  -- 4. Free old seat
  UPDATE seats SET is_available = TRUE  WHERE id = v_old_seat_id;
  -- 5. Lock new seat
  UPDATE seats SET is_available = FALSE WHERE id = p_new_seat_id;

  -- 6. Update booking
  UPDATE bookings
  SET    flight_id   = p_new_flight_id,
         seat_id     = p_new_seat_id,
         status      = 'rescheduled',
         total_price = v_new_total
  WHERE  id = p_booking_id;

  -- 7. Record reschedule
  INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, v_fee);

  RETURN QUERY SELECT v_fee;
END;
$$;

-- ─── TRIGGER: enforce 2-hour cancellation at DB level ────────
-- Acts as a safety net even if the RPC is bypassed.
CREATE OR REPLACE FUNCTION enforce_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
BEGIN
  -- Only fire when status is being set to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT departs_at INTO v_departs_at
    FROM   flights
    WHERE  id = NEW.flight_id;

    IF v_departs_at - NOW() < INTERVAL '2 hours' THEN
      RAISE EXCEPTION 'cancellation_window_closed'
        USING HINT = 'Cancellations are blocked within 2 hours of departure.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cancellation_window
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_cancellation_window();

-- ─── GRANT EXECUTE to authenticated users ────────────────────
GRANT EXECUTE ON FUNCTION lock_and_book_seat  TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking      TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_booking  TO authenticated;