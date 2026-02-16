-- Phase 7: Employee Dashboard RLS Policies
--
-- Most employee policies already exist in the initial schema:
--   "Employees can view own record"       (employees SELECT, user_id = auth.uid())
--   "Employees can update own record"     (employees UPDATE, user_id = auth.uid())
--   "Employees can view own tips"         (tips SELECT, employee_id subquery)
--   "Employees can view own distributions" (payout_distributions SELECT, employee_id subquery)
--   "Public can view active venues"       (venues SELECT, is_active = TRUE)
--
-- This migration adds only the missing policy: employees reading payouts
-- that have distributions for them.
--
-- SECURITY DEFINER functions are used to bypass RLS when looking up
-- employee/payout IDs, avoiding infinite recursion from circular
-- policy dependencies (e.g. payouts ↔ payout_distributions).

-- Helper: returns the current user's employee record IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_employee_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid();
$$;

-- Helper: returns payout IDs for the current user's employee records (bypasses RLS)
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

-- Employees can read payouts that have distributions for them
CREATE POLICY "payouts_select_via_distribution"
  ON payouts
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_my_payout_ids()));
