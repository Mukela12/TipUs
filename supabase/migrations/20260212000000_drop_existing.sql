-- ============================================
-- Drop existing tables (no production data yet)
-- Run this BEFORE 001_initial_schema.sql
-- ============================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS public.employee_invitations CASCADE;
DROP TABLE IF EXISTS public.payout_distributions CASCADE;
DROP TABLE IF EXISTS public.qr_codes CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.tips CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;

-- Drop trigger function if it exists
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
