-- Update the trigger function to assign roles based on user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from user metadata, default to 'learner' if not specified
  user_role := COALESCE(
    (new.raw_user_meta_data->>'role')::app_role,
    'learner'::app_role
  );

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role);

  -- Insert profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.email, new.phone, '')
  );

  RETURN new;
END;
$$;