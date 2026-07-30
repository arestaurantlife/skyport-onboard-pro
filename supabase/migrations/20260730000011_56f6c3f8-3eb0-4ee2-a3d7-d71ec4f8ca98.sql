-- ============================================================
-- Prompt 1 — Tenancy, people, roles
-- Database only. No policies (prompt 6 writes those).
-- ============================================================

-- ---------- enum: what someone can DO in the software ----------
-- Named platform_role to avoid colliding with the pre-existing
-- app_role enum (employee/manager/admin) used by legacy user_roles.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_role') THEN
    CREATE TYPE public.platform_role AS ENUM (
      'super_admin',
      'org_admin',
      'director_of_operations',
      'general_manager',
      'manager',
      'assistant_manager',
      'trainee'
    );
  END IF;
END$$;

-- ---------- organizations ----------
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  logo_url text,
  unit_label text NOT NULL DEFAULT 'module',
  pass_threshold_default integer NOT NULL DEFAULT 90,
  invite_expiry_days integer NOT NULL DEFAULT 14,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ---------- job_roles (org_id null = global) ----------
CREATE TABLE public.job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  key text NOT NULL,
  is_management boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- unique on (org_id, key), treating null org_id as a single global namespace
CREATE UNIQUE INDEX job_roles_org_key_uidx
  ON public.job_roles (COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid), key);

GRANT SELECT ON public.job_roles TO authenticated;
GRANT ALL ON public.job_roles TO service_role;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

-- ---------- outlets: extend, do not recreate ----------
ALTER TABLE public.outlets
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS concourse text;

-- ---------- profiles: extend, do not recreate ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_outlet_id uuid REFERENCES public.outlets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_role_key text,
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS hire_date date;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (preferred_language IN ('en','es'));

-- ---------- app_role_assignments ----------
CREATE TABLE public.app_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  app_role public.platform_role NOT NULL,
  outlet_scope_id uuid REFERENCES public.outlets(id) ON DELETE SET NULL,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX app_role_assignments_active_uidx
  ON public.app_role_assignments (user_id, org_id, app_role, COALESCE(outlet_scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE revoked_at IS NULL;

CREATE INDEX app_role_assignments_user_idx ON public.app_role_assignments (user_id) WHERE revoked_at IS NULL;

GRANT SELECT ON public.app_role_assignments TO authenticated;
GRANT ALL ON public.app_role_assignments TO service_role;
ALTER TABLE public.app_role_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Security-definer helpers. Policies call these; without
-- SECURITY DEFINER every policy on profiles recurses infinitely.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.org_id
    FROM public.profiles p
   WHERE p.id = auth.uid()
     AND p.org_id IS NOT NULL
  UNION
  SELECT a.org_id
    FROM public.app_role_assignments a
   WHERE a.user_id = auth.uid()
     AND a.revoked_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.has_app_role(target_role text, target_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.app_role_assignments a
     WHERE a.user_id = auth.uid()
       AND a.org_id = target_org
       AND a.app_role = target_role::public.platform_role
       AND a.revoked_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.current_org_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_app_role(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_org_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_app_role(text, uuid) TO authenticated, service_role;

-- ============================================================
-- Seed
-- ============================================================

INSERT INTO public.organizations (name, legal_name, slug, unit_label, pass_threshold_default, invite_expiry_days)
VALUES ('Skyportco', 'First Meridian Services', 'skyportco', 'module', 90, 14)
ON CONFLICT (slug) DO NOTHING;

-- Link the three existing outlets to Skyportco and set concourses.
UPDATE public.outlets o
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'skyportco')
 WHERE o.org_id IS NULL;

UPDATE public.outlets SET concourse = 'Concourse A' WHERE name = 'Mesa Verde Cantina';
UPDATE public.outlets SET concourse = 'Concourse C' WHERE name = 'Rocky Brew Coffee';
UPDATE public.outlets SET concourse = 'Concourse B' WHERE name = 'Altitude Burger Co.';

-- Backfill profiles onto the org and mirror their existing outlet.
UPDATE public.profiles p
   SET org_id = (SELECT id FROM public.organizations WHERE slug = 'skyportco')
 WHERE p.org_id IS NULL;

UPDATE public.profiles p
   SET primary_outlet_id = p.outlet_id
 WHERE p.primary_outlet_id IS NULL AND p.outlet_id IS NOT NULL;

UPDATE public.profiles p
   SET job_role_key = p.job_role::text
 WHERE p.job_role_key IS NULL AND p.job_role IS NOT NULL;

UPDATE public.profiles p
   SET hire_date = p.hired_at::date
 WHERE p.hire_date IS NULL;

-- Eleven global job roles.
INSERT INTO public.job_roles (org_id, key, is_management, sort_order) VALUES
  (NULL, 'server',                 false, 10),
  (NULL, 'hostess',                false, 20),
  (NULL, 'support',                false, 30),
  (NULL, 'bartender',              false, 40),
  (NULL, 'cook',                   false, 50),
  (NULL, 'dishwasher',             false, 60),
  (NULL, 'food_runner',            false, 70),
  (NULL, 'manager',                true,  80),
  (NULL, 'assistant_manager',      true,  90),
  (NULL, 'general_manager',        true, 100),
  (NULL, 'director_of_operations', true, 110)
ON CONFLICT DO NOTHING;
