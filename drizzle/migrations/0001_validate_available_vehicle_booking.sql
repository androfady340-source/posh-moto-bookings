-- Do not accept bookings for vehicles that have been marked unavailable.
-- Lock the vehicle row so a concurrent availability change cannot race this check.
CREATE OR REPLACE FUNCTION public.bookings_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p numeric;
  available boolean;
BEGIN
  SELECT price_egp, is_available
    INTO p, available
    FROM public.vehicles
    WHERE id = NEW.vehicle_id
    FOR UPDATE;

  IF p IS NULL THEN
    RAISE EXCEPTION 'Vehicle not found';
  END IF;

  IF NOT available THEN
    RAISE EXCEPTION 'Vehicle unavailable';
  END IF;

  IF NEW.preferred_date < current_date THEN
    RAISE EXCEPTION 'Date must be today or later';
  END IF;

  NEW.deposit_egp := round(p * 0.05);
  NEW.status := 'pending';
  RETURN NEW;
END $$;
