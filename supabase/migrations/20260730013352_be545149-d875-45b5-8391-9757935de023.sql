-- Fix role helper ambiguity so RLS checks resolve the signed-in user's roles correctly.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$$;

-- Keep first-admin bootstrap compatible with the corrected role helper.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_has_admin boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.role = 'admin'::public.app_role
  ) INTO v_has_admin;

  IF v_has_admin THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin'::public.app_role), (v_uid, 'manager'::public.app_role), (v_uid, 'employee'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- Keep role administration compatible with the corrected helper and prevent self admin removal.
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role, _grant boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden_admin_only';
  END IF;

  IF _role = 'admin'::public.app_role AND _user_id = v_uid AND NOT _grant THEN
    RAISE EXCEPTION 'cannot_remove_own_admin';
  END IF;

  IF _grant THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _role)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role;
  END IF;
END;
$$;

-- Repair signup profile creation: the function existed, but the auth trigger was missing.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE
          WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name
          ELSE public.profiles.full_name
        END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Repair the owner admin account so it can operate the website now.
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, r.role::public.app_role
FROM public.profiles p
CROSS JOIN (VALUES ('employee'), ('manager'), ('admin')) AS r(role)
WHERE lower(p.email) = lower('arestaurant.life@gmail.com')
ON CONFLICT DO NOTHING;

UPDATE public.profiles p
SET full_name = CASE WHEN trim(p.full_name) = '' THEN 'Skyportco Administrator' ELSE p.full_name END
WHERE lower(p.email) = lower('arestaurant.life@gmail.com');