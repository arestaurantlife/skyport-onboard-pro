GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT ON public.outlets TO authenticated;
GRANT ALL ON public.outlets TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;

GRANT SELECT ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

GRANT SELECT ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;

GRANT SELECT ON public.chapters TO authenticated;
GRANT ALL ON public.chapters TO service_role;

GRANT SELECT, INSERT ON public.chapter_progress TO authenticated;
GRANT ALL ON public.chapter_progress TO service_role;

GRANT SELECT ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;

GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

GRANT SELECT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

GRANT SELECT ON public.certificate_audit_log TO authenticated;
GRANT ALL ON public.certificate_audit_log TO service_role;

GRANT SELECT, INSERT ON public.email_send_log TO authenticated;
GRANT ALL ON public.email_send_log TO service_role;

GRANT SELECT, UPDATE ON public.email_send_state TO authenticated;
GRANT ALL ON public.email_send_state TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.email_unsubscribe_tokens TO authenticated;
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

GRANT SELECT, INSERT ON public.suppressed_emails TO authenticated;
GRANT ALL ON public.suppressed_emails TO service_role;