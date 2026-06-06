
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten invite update: only allow setting used_by/used_at to your own id
DROP POLICY "Anyone authenticated can mark invite used" ON public.invites;
CREATE POLICY "Authenticated can claim invite for self" ON public.invites
  FOR UPDATE TO authenticated
  USING (used_by IS NULL AND expires_at > now())
  WITH CHECK (used_by = auth.uid());
