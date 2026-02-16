-- Fix: Drop the policies from the original Phase 7 migration that
-- caused infinite recursion and/or duplicated existing policies.
-- These were already applied and need to be cleaned up.

-- Drop the recursion-causing venues policy
DROP POLICY IF EXISTS "venues_select_employee" ON venues;

-- Drop duplicate policies (these already exist from initial schema)
DROP POLICY IF EXISTS "employees_select_own" ON employees;
DROP POLICY IF EXISTS "employees_update_own_bank" ON employees;
DROP POLICY IF EXISTS "tips_select_own_employee" ON tips;
DROP POLICY IF EXISTS "payout_distributions_select_own" ON payout_distributions;

-- Drop the old payouts policy if it exists (will be recreated with SECURITY DEFINER function)
DROP POLICY IF EXISTS "payouts_select_via_distribution" ON payouts;

-- Helper function: returns the current user's employee record IDs
-- bypassing RLS to avoid recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.get_my_employee_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid();
$$;

-- Recreate payouts policy using the SECURITY DEFINER function
CREATE POLICY "payouts_select_via_distribution"
  ON payouts
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT payout_id FROM payout_distributions
      WHERE employee_id IN (SELECT get_my_employee_ids())
    )
  );
