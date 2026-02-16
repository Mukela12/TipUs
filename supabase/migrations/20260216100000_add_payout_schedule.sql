-- Add recurring payout schedule columns to venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS auto_payout_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payout_frequency TEXT DEFAULT 'weekly'
    CHECK (payout_frequency IN ('weekly', 'fortnightly', 'monthly')),
  ADD COLUMN IF NOT EXISTS payout_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_auto_payout_at TIMESTAMPTZ;
