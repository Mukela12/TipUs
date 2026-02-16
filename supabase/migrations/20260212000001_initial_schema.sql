-- ============================================
-- TipUs Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ============================================
-- 1. VENUES
-- ============================================
CREATE TABLE public.venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  logo_url TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'business')),
  subscription_status TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_venues_owner_id ON public.venues(owner_id);
CREATE INDEX idx_venues_slug ON public.venues(slug);

-- RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Venue owners can read their own venues
CREATE POLICY "Venue owners can view own venues"
  ON public.venues FOR SELECT
  USING (auth.uid() = owner_id);

-- Venue owners can insert their own venues
CREATE POLICY "Venue owners can create venues"
  ON public.venues FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Venue owners can update their own venues
CREATE POLICY "Venue owners can update own venues"
  ON public.venues FOR UPDATE
  USING (auth.uid() = owner_id);

-- Public can read active venues (for tipping page)
CREATE POLICY "Public can view active venues"
  ON public.venues FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- 2. EMPLOYEES
-- ============================================
CREATE TABLE public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive')),
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  bank_bsb TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employees_venue_id ON public.employees(venue_id);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_invitation_token ON public.employees(invitation_token);
CREATE INDEX idx_employees_email ON public.employees(email);

-- RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Venue owners can manage employees of their venues
CREATE POLICY "Venue owners can view own employees"
  ON public.employees FOR SELECT
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

CREATE POLICY "Venue owners can create employees"
  ON public.employees FOR INSERT
  WITH CHECK (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

CREATE POLICY "Venue owners can update own employees"
  ON public.employees FOR UPDATE
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

-- Employees can view their own record
CREATE POLICY "Employees can view own record"
  ON public.employees FOR SELECT
  USING (auth.uid() = user_id);

-- Employees can update their own profile (bank details, avatar)
CREATE POLICY "Employees can update own record"
  ON public.employees FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. TIPS
-- ============================================
CREATE TABLE public.tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'aud',
  tipper_name TEXT,
  tipper_message TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tips_venue_id ON public.tips(venue_id);
CREATE INDEX idx_tips_employee_id ON public.tips(employee_id);
CREATE INDEX idx_tips_status ON public.tips(status);
CREATE INDEX idx_tips_created_at ON public.tips(created_at DESC);
CREATE INDEX idx_tips_stripe_checkout ON public.tips(stripe_checkout_session_id);

-- RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Venue owners can view tips for their venues
CREATE POLICY "Venue owners can view own tips"
  ON public.tips FOR SELECT
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

-- Anyone can insert tips (anonymous tippers via Stripe Checkout)
-- The actual payment validation happens server-side via webhook
CREATE POLICY "Anyone can create tips"
  ON public.tips FOR INSERT
  WITH CHECK (TRUE);

-- Employees can view tips assigned to them
CREATE POLICY "Employees can view own tips"
  ON public.tips FOR SELECT
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

-- ============================================
-- 4. PAYOUTS
-- ============================================
CREATE TABLE public.payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0,
  platform_fee INTEGER NOT NULL DEFAULT 0,
  net_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payouts_venue_id ON public.payouts(venue_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue owners can view own payouts"
  ON public.payouts FOR SELECT
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

-- ============================================
-- 5. PAYOUT DISTRIBUTIONS (per-employee breakdown)
-- ============================================
CREATE TABLE public.payout_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  amount INTEGER NOT NULL DEFAULT 0,
  days_active INTEGER NOT NULL,
  total_period_days INTEGER NOT NULL,
  is_prorated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payout_dist_payout ON public.payout_distributions(payout_id);
CREATE INDEX idx_payout_dist_employee ON public.payout_distributions(employee_id);

-- RLS
ALTER TABLE public.payout_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue owners can view distributions"
  ON public.payout_distributions FOR SELECT
  USING (
    payout_id IN (
      SELECT id FROM public.payouts WHERE venue_id IN (
        SELECT id FROM public.venues WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Employees can view own distributions"
  ON public.payout_distributions FOR SELECT
  USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

-- ============================================
-- 6. QR CODES
-- ============================================
CREATE TABLE public.qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id),
  label TEXT,
  short_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_qr_codes_venue_id ON public.qr_codes(venue_id);
CREATE INDEX idx_qr_codes_short_code ON public.qr_codes(short_code);

-- RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue owners can manage own QR codes"
  ON public.qr_codes FOR SELECT
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

CREATE POLICY "Venue owners can create QR codes"
  ON public.qr_codes FOR INSERT
  WITH CHECK (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

CREATE POLICY "Venue owners can update own QR codes"
  ON public.qr_codes FOR UPDATE
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

-- Public can read active QR codes (for tipping page lookup)
CREATE POLICY "Public can lookup active QR codes"
  ON public.qr_codes FOR SELECT
  USING (is_active = TRUE);

-- Increment scan count (anyone)
CREATE POLICY "Anyone can update scan count"
  ON public.qr_codes FOR UPDATE
  USING (is_active = TRUE);

-- ============================================
-- 7. EMPLOYEE INVITATIONS (audit trail)
-- ============================================
CREATE TABLE public.employee_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invitations_token ON public.employee_invitations(token);
CREATE INDEX idx_invitations_employee ON public.employee_invitations(employee_id);

-- RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue owners can view own invitations"
  ON public.employee_invitations FOR SELECT
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

CREATE POLICY "Venue owners can create invitations"
  ON public.employee_invitations FOR INSERT
  WITH CHECK (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
  );

-- ============================================
-- 8. AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_venues
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_employees
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Done! All tables created with RLS policies.
-- ============================================
