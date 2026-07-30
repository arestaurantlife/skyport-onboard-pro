DROP POLICY IF EXISTS "Users insert own attempts" ON public.quiz_attempts;
REVOKE INSERT, UPDATE, DELETE ON public.quiz_attempts FROM authenticated, anon;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;