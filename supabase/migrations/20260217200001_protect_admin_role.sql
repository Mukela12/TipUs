-- Prevent users from self-assigning the admin role via user metadata updates.
-- Only existing admins (or service_role) can set role = 'admin'.
-- This trigger runs BEFORE insert/update on auth.users.

CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new role is 'admin', check if the request is from an admin or service_role
  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    -- Allow if the user is already an admin (updating their own profile)
    IF TG_OP = 'UPDATE' AND (OLD.raw_user_meta_data->>'role') = 'admin' THEN
      RETURN NEW;
    END IF;

    -- Allow service_role (used by admin invite edge function)
    IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- Otherwise, strip the admin role back to venue_owner
    NEW.raw_user_meta_data = jsonb_set(
      NEW.raw_user_meta_data,
      '{role}',
      '"venue_owner"'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists, then create
DROP TRIGGER IF EXISTS protect_admin_role_trigger ON auth.users;
CREATE TRIGGER protect_admin_role_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_role();
