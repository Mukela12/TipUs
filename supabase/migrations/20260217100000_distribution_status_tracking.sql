-- Track individual distribution transfer status to prevent double-payments on retry
ALTER TABLE public.payout_distributions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS error_message text;

-- Allow payouts to be partially_completed when some transfers succeed and others fail
-- Check if a constraint exists first, then alter it
DO $$
BEGIN
  -- Try to drop old constraint if it exists
  ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payouts_status_check;
  -- No constraint may exist (text column), so this is just a safety measure
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
