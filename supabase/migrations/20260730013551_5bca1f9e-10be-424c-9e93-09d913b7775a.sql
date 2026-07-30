GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

GRANT EXECUTE ON FUNCTION public.current_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_org_ids() TO service_role;
REVOKE EXECUTE ON FUNCTION public.current_org_ids() FROM anon;

GRANT EXECUTE ON FUNCTION public.has_app_role(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_app_role(text, uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.has_app_role(text, uuid) FROM anon;