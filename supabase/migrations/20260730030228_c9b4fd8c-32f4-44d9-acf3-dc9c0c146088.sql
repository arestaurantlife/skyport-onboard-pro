
-- Author-tier helper: legacy admin/manager roles
CREATE OR REPLACE FUNCTION public.is_content_author()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'manager'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.is_content_author() TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.chapters TO service_role;
GRANT ALL ON public.quizzes TO service_role;
GRANT ALL ON public.quiz_questions TO service_role;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['courses','modules','chapters','quizzes','quiz_questions'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authors can insert %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authors can update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authors can delete %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "Authors can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_content_author())', t);
    EXECUTE format('CREATE POLICY "Authors can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_content_author()) WITH CHECK (public.is_content_author())', t);
    EXECUTE format('CREATE POLICY "Authors can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.is_content_author())', t);
  END LOOP;
END $$;
