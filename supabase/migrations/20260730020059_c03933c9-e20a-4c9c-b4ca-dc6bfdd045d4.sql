CREATE OR REPLACE FUNCTION public.invite_code_is_valid(_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invites i
    WHERE upper(i.code) = upper(trim(_code))
      AND i.used_by IS NULL
      AND i.expires_at > now()
  );
$$;

REVOKE ALL ON FUNCTION public.invite_code_is_valid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_code_is_valid(text) TO anon, authenticated, service_role;