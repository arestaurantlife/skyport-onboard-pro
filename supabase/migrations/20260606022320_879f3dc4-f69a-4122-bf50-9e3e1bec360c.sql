
CREATE POLICY "Users can self-insert their role" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
