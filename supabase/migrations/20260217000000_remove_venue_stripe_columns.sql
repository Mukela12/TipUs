-- Money now stays on TipUs platform; venues do not need Stripe Express accounts
ALTER TABLE public.venues DROP COLUMN IF EXISTS stripe_account_id;
ALTER TABLE public.venues DROP COLUMN IF EXISTS stripe_onboarding_complete;
