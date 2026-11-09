-- Limit role checks to the caller's own account.
-- The function is SECURITY DEFINER, so it must not be usable as a user-enumeration oracle.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND user_id = _user_id
      AND role = _role
  )
$$;

-- Only authenticated users need this helper for admin UI and RLS checks.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Backfill the designated showroom administrator if the account existed
-- before the original auth.users trigger was installed.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'androfady340@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Anonymous visitors may read approved reviews, but must not invoke the
-- SECURITY DEFINER role-check function.
DROP POLICY IF EXISTS "read approved reviews" ON public.reviews;

CREATE POLICY "public read approved reviews"
  ON public.reviews
  FOR SELECT
  TO anon
  USING (approved = true);

CREATE POLICY "read approved reviews or admin"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (approved = true OR public.has_role(auth.uid(), 'admin'));
