DROP POLICY IF EXISTS "Outlets viewable by authenticated users" ON public.outlets;

CREATE POLICY "Outlets viewable by managers and admins"
ON public.outlets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.outlets_public
WITH (security_invoker = on) AS
SELECT id, name, created_at
FROM public.outlets;

GRANT SELECT ON public.outlets_public TO authenticated;