-- Step 1: drop legacy policies
DROP POLICY IF EXISTS "Managers and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Outlets viewable by managers and admins" ON public.outlets;

-- Manager-tier helper (has_app_role only does exact role match)
CREATE OR REPLACE FUNCTION public.has_manager_tier(target_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_app_role('manager', target_org)
      OR public.has_app_role('assistant_manager', target_org)
      OR public.has_app_role('general_manager', target_org)
      OR public.has_app_role('director_of_operations', target_org)
      OR public.has_app_role('org_admin', target_org)
      OR public.has_app_role('super_admin', target_org);
$$;

CREATE OR REPLACE FUNCTION public.has_org_admin_tier(target_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_app_role('org_admin', target_org)
      OR public.has_app_role('super_admin', target_org);
$$;

REVOKE ALL ON FUNCTION public.has_manager_tier(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_org_admin_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_manager_tier(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_org_admin_tier(uuid) TO authenticated, service_role;

-- Step 2: new policies
-- profiles
CREATE POLICY "profiles_select_self_or_org_manager" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR (org_id IN (SELECT public.current_org_ids()) AND public.has_manager_tier(org_id))
);

CREATE POLICY "profiles_insert_self" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- outlets
CREATE POLICY "outlets_select_org" ON public.outlets
FOR SELECT TO authenticated
USING (org_id IN (SELECT public.current_org_ids()));

-- organizations
CREATE POLICY "organizations_select_org" ON public.organizations
FOR SELECT TO authenticated
USING (id IN (SELECT public.current_org_ids()));

-- job_roles
CREATE POLICY "job_roles_select_global_or_org" ON public.job_roles
FOR SELECT TO authenticated
USING (org_id IS NULL OR org_id IN (SELECT public.current_org_ids()));

-- app_role_assignments
CREATE POLICY "ara_select_self_or_org_manager" ON public.app_role_assignments
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (org_id IN (SELECT public.current_org_ids()) AND public.has_manager_tier(org_id))
);

CREATE POLICY "ara_insert_org_admin" ON public.app_role_assignments
FOR INSERT TO authenticated
WITH CHECK (org_id IN (SELECT public.current_org_ids()) AND public.has_org_admin_tier(org_id));

CREATE POLICY "ara_update_org_admin" ON public.app_role_assignments
FOR UPDATE TO authenticated
USING (org_id IN (SELECT public.current_org_ids()) AND public.has_org_admin_tier(org_id))
WITH CHECK (org_id IN (SELECT public.current_org_ids()) AND public.has_org_admin_tier(org_id));

-- Grants (Data API access)
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT ON public.job_roles TO authenticated;
GRANT ALL ON public.job_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.app_role_assignments TO authenticated;
GRANT ALL ON public.app_role_assignments TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.outlets TO authenticated;
GRANT ALL ON public.outlets TO service_role;