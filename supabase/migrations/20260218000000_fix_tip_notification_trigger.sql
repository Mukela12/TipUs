-- Fix: tip notification trigger only fires on UPDATE, but tips are inserted
-- with status 'succeeded' directly from the webhook. Need an INSERT trigger too.
-- Can't combine INSERT+UPDATE in one trigger when WHEN clause references OLD.

-- Drop the old UPDATE-only trigger
DROP TRIGGER IF EXISTS trg_notify_tip_received ON public.tips;

-- Trigger for INSERT: fires when a tip is inserted with status 'succeeded'
CREATE TRIGGER trg_notify_tip_received_insert
  AFTER INSERT ON public.tips
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION public.notify_tip_received();

-- Trigger for UPDATE: fires when a tip status changes to 'succeeded'
CREATE TRIGGER trg_notify_tip_received_update
  AFTER UPDATE ON public.tips
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded' AND OLD.status IS DISTINCT FROM 'succeeded')
  EXECUTE FUNCTION public.notify_tip_received();

-- Add unique constraint on stripe_payment_intent_id to prevent duplicate tips
-- (allows nulls since not all tips may have a payment intent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tips_stripe_payment_intent_id
  ON public.tips (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
