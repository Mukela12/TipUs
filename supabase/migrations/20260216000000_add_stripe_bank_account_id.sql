-- Add Stripe bank account ID to employees for automatic payouts
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS stripe_bank_account_id TEXT;
