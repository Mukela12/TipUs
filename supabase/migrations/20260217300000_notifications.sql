-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('qr_code_created', 'tip_received', 'payout_completed', 'payout_failed')),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE NOT is_read;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all notifications
CREATE POLICY "Admins can read all notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Trigger: notify on QR code creation
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_qr_code_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_venue_name TEXT;
  v_label TEXT;
  v_admin RECORD;
BEGIN
  -- Look up venue owner and name
  SELECT owner_id, name INTO v_owner_id, v_venue_name
  FROM public.venues WHERE id = NEW.venue_id;

  v_label := COALESCE(NEW.label, NEW.short_code);

  -- Notify venue owner
  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_owner_id,
      'qr_code_created',
      'New QR code created',
      'QR code "' || v_label || '" was created for ' || v_venue_name,
      jsonb_build_object('venue_id', NEW.venue_id, 'qr_code_id', NEW.id)
    );
  END IF;

  -- Notify all admins
  FOR v_admin IN
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'admin'
      AND id IS DISTINCT FROM v_owner_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_admin.id,
      'qr_code_created',
      'New QR code created',
      'QR code "' || v_label || '" was created for ' || v_venue_name,
      jsonb_build_object('venue_id', NEW.venue_id, 'qr_code_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_qr_code_created
  AFTER INSERT ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_qr_code_created();

-- ============================================================
-- Trigger: notify on tip succeeded
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_tip_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_venue_name TEXT;
  v_amount_display TEXT;
  v_employee_user_id UUID;
BEGIN
  -- Look up venue
  SELECT owner_id, name INTO v_owner_id, v_venue_name
  FROM public.venues WHERE id = NEW.venue_id;

  v_amount_display := '$' || TRIM(TO_CHAR(NEW.amount / 100.0, '999999990.00'));

  -- Notify venue owner
  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_owner_id,
      'tip_received',
      'New tip received',
      v_amount_display || ' tip at ' || v_venue_name,
      jsonb_build_object('venue_id', NEW.venue_id, 'tip_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;

  -- Notify assigned employee if any
  IF NEW.employee_id IS NOT NULL THEN
    SELECT user_id INTO v_employee_user_id
    FROM public.employees WHERE id = NEW.employee_id;

    IF v_employee_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, metadata)
      VALUES (
        v_employee_user_id,
        'tip_received',
        'You received a tip!',
        v_amount_display || ' tip at ' || v_venue_name,
        jsonb_build_object('venue_id', NEW.venue_id, 'tip_id', NEW.id, 'amount', NEW.amount)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_tip_received
  AFTER UPDATE ON public.tips
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded' AND OLD.status IS DISTINCT FROM 'succeeded')
  EXECUTE FUNCTION public.notify_tip_received();

-- ============================================================
-- Trigger: notify on payout status change
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_payout_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_venue_name TEXT;
  v_amount_display TEXT;
  v_title TEXT;
  v_body TEXT;
  v_type TEXT;
  v_admin RECORD;
  v_dist RECORD;
  v_emp_user_id UUID;
BEGIN
  -- Look up venue
  SELECT owner_id, name INTO v_owner_id, v_venue_name
  FROM public.venues WHERE id = NEW.venue_id;

  v_amount_display := '$' || TRIM(TO_CHAR(NEW.net_amount / 100.0, '999999990.00'));

  IF NEW.status IN ('completed', 'partially_completed') THEN
    v_type := 'payout_completed';
    v_title := 'Payout completed';
    v_body := v_amount_display || ' payout for ' || v_venue_name || ' has been processed';
  ELSE
    v_type := 'payout_failed';
    v_title := 'Payout failed';
    v_body := 'Payout of ' || v_amount_display || ' for ' || v_venue_name || ' has failed';
  END IF;

  -- Notify venue owner
  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_owner_id,
      v_type,
      v_title,
      v_body,
      jsonb_build_object('venue_id', NEW.venue_id, 'payout_id', NEW.id, 'amount', NEW.net_amount)
    );
  END IF;

  -- Notify all admins
  FOR v_admin IN
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'admin'
      AND id IS DISTINCT FROM v_owner_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      v_admin.id,
      v_type,
      v_title,
      v_body,
      jsonb_build_object('venue_id', NEW.venue_id, 'payout_id', NEW.id, 'amount', NEW.net_amount)
    );
  END LOOP;

  -- For completed/partially_completed payouts, notify each employee with a distribution
  IF NEW.status IN ('completed', 'partially_completed') THEN
    FOR v_dist IN
      SELECT pd.employee_id, pd.amount
      FROM public.payout_distributions pd
      WHERE pd.payout_id = NEW.id
    LOOP
      SELECT user_id INTO v_emp_user_id
      FROM public.employees WHERE id = v_dist.employee_id;

      IF v_emp_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, body, metadata)
        VALUES (
          v_emp_user_id,
          'payout_completed',
          'Payout received',
          '$' || TRIM(TO_CHAR(v_dist.amount / 100.0, '999999990.00')) || ' has been deposited to your account',
          jsonb_build_object('venue_id', NEW.venue_id, 'payout_id', NEW.id, 'amount', v_dist.amount)
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_payout_status_changed
  AFTER UPDATE ON public.payouts
  FOR EACH ROW
  WHEN (
    NEW.status IN ('completed', 'partially_completed', 'failed')
    AND OLD.status IS DISTINCT FROM NEW.status
  )
  EXECUTE FUNCTION public.notify_payout_status_changed();
