-- RPC function to atomically increment scan_count on a QR code
CREATE OR REPLACE FUNCTION public.increment_scan_count(qr_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.qr_codes
  SET scan_count = scan_count + 1
  WHERE id = qr_id;
$$;
