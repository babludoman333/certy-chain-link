-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('issuer', 'learner', 'verifier');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  issuer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_name TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_hash TEXT NOT NULL UNIQUE,
  txn_id TEXT NOT NULL UNIQUE,
  file_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create verifications table
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE NOT NULL,
  verifier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  verified_on TIMESTAMPTZ DEFAULT now() NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('authentic', 'invalid', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for certificates
CREATE POLICY "Issuers can view all certificates they issued"
  ON public.certificates FOR SELECT
  USING (public.has_role(auth.uid(), 'issuer') AND issuer_id = auth.uid());

CREATE POLICY "Learners can view their own certificates"
  ON public.certificates FOR SELECT
  USING (public.has_role(auth.uid(), 'learner') AND learner_id = auth.uid());

CREATE POLICY "Verifiers can view all certificates"
  ON public.certificates FOR SELECT
  USING (public.has_role(auth.uid(), 'verifier'));

CREATE POLICY "Issuers can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'issuer') AND issuer_id = auth.uid());

CREATE POLICY "Issuers can update their issued certificates"
  ON public.certificates FOR UPDATE
  USING (public.has_role(auth.uid(), 'issuer') AND issuer_id = auth.uid());

-- RLS Policies for verifications
CREATE POLICY "Anyone can view verifications"
  ON public.verifications FOR SELECT
  USING (true);

CREATE POLICY "Verifiers can insert verifications"
  ON public.verifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'verifier') OR verifier_id IS NULL);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();