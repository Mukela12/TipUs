-- Fix: payouts ↔ payout_distributions circular RLS dependency.
--
-- The "payouts_select_via_distribution" policy subqueries payout_distributions,
-- whose "Venue owners can view distributions" policy subqueries payouts → recursion.
--
-- Fix: use a SECURITY DEFINER function that returns the payout_ids for the
-- current employee, bypassing RLS on both payout_distributions and employees.

DROP POLICY IF EXISTS "payouts_select_via_distribution" ON payouts;

-- Returns payout IDs associated with the current user's employee records.
-- SECURITY DEFINER bypasses RLS, breaking the circular chain.
CREATE OR REPLACE FUNCTION public.get_my_payout_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT pd.payout_id
  FROM public.payout_distributions pd
  WHERE pd.employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  );
$$;

-- Recreate policy using the function
CREATE POLICY "payouts_select_via_distribution"
  ON payouts
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_my_payout_ids()));
