-- Helper function: check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin',
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admin can view ALL venues
CREATE POLICY "Admins can view all venues"
  ON public.venues FOR SELECT USING (public.is_admin());

-- Admin can view ALL employees
CREATE POLICY "Admins can view all employees"
  ON public.employees FOR SELECT USING (public.is_admin());

-- Admin can view ALL tips
CREATE POLICY "Admins can view all tips"
  ON public.tips FOR SELECT USING (public.is_admin());

-- Admin can view ALL payouts
CREATE POLICY "Admins can view all payouts"
  ON public.payouts FOR SELECT USING (public.is_admin());

-- Admin can INSERT payouts (for triggering manual payouts)
CREATE POLICY "Admins can create payouts"
  ON public.payouts FOR INSERT WITH CHECK (public.is_admin());

-- Admin can view ALL distributions
CREATE POLICY "Admins can view all distributions"
  ON public.payout_distributions FOR SELECT USING (public.is_admin());

-- Admin can manage QR codes for any venue
CREATE POLICY "Admins can view all QR codes"
  ON public.qr_codes FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create QR codes"
  ON public.qr_codes FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update QR codes"
  ON public.qr_codes FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete QR codes"
  ON public.qr_codes FOR DELETE USING (public.is_admin());
