
-- 1) Restrict outlets table to authenticated users (hide manager_name/director_name from public)
DROP POLICY IF EXISTS "Outlets are viewable by everyone" ON public.outlets;
CREATE POLICY "Outlets viewable by authenticated users"
  ON public.outlets FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.outlets FROM anon;

-- 2) Lock down email-queue helper functions to service_role only, and pin search_path
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 3) Revoke anonymous execute on user-scoped SECURITY DEFINER functions (they all require auth.uid())
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grade_quiz(uuid, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_quiz_questions(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.issue_certificate_if_complete(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role, boolean) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grade_quiz(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_certificate_if_complete(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role, boolean) TO authenticated;
