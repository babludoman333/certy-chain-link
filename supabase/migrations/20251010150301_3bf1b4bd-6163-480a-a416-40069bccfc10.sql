-- Drop the existing foreign key on user_roles that points to profiles
ALTER TABLE public.user_roles
DROP CONSTRAINT user_roles_user_id_fkey;

-- Add correct foreign key pointing to auth.users
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;