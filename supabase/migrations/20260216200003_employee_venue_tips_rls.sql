-- Allow employees to read ALL tips from their venue (not just tips directed to them).
-- Uses a SECURITY DEFINER function to avoid any recursive RLS evaluation.

CREATE OR REPLACE FUNCTION public.get_my_venue_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT venue_id FROM public.employees WHERE user_id = auth.uid();
$$;

CREATE POLICY "employees_select_venue_tips"
  ON tips
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT get_my_venue_ids()));
