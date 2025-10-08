-- Fix function search_path security issue and add role assignment
-- Drop trigger first, then function, then recreate both

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  
  -- Automatically assign 'learner' role to all new users
  -- This prevents privilege escalation during signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'learner'::app_role);
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add RLS policies for user_roles table to prevent unauthorized modifications
-- Note: These policies are intentionally restrictive
-- Role assignment should only happen through the trigger above or admin edge functions

-- No direct INSERT allowed (only through trigger)
CREATE POLICY "Only system can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

-- No UPDATE allowed (roles are immutable for audit trail)
CREATE POLICY "Roles cannot be updated"
ON public.user_roles
FOR UPDATE
USING (false);

-- No DELETE allowed (maintain audit trail)
CREATE POLICY "Roles cannot be deleted"
ON public.user_roles
FOR DELETE
USING (false);