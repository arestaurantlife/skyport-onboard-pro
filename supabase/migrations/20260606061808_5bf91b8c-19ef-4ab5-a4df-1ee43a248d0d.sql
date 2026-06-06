
-- Audit log table
CREATE TABLE public.certificate_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  certificate_id uuid NULL,
  outcome text NOT NULL,
  reason text NULL,
  quizzes_required int NULL,
  quizzes_passed int NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.certificate_audit_log TO authenticated;
GRANT ALL ON public.certificate_audit_log TO service_role;

ALTER TABLE public.certificate_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own audit rows"
  ON public.certificate_audit_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers and admins can view all audit rows"
  ON public.certificate_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_cert_audit_user_created ON public.certificate_audit_log (user_id, created_at DESC);
CREATE INDEX idx_cert_audit_course_created ON public.certificate_audit_log (course_id, created_at DESC);

-- Replace the issuance function to write audit rows and return outcome
DROP FUNCTION IF EXISTS public.issue_certificate_if_complete(uuid);

CREATE OR REPLACE FUNCTION public.issue_certificate_if_complete(_course_id uuid)
RETURNS TABLE(certificate_id uuid, serial text, issued_at timestamptz, already_existed boolean, outcome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_total_quizzes int;
  v_passed_quizzes int;
  v_existing record;
  v_serial text;
  v_new record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT count(*) INTO v_total_quizzes
    FROM public.quizzes q
    JOIN public.modules m ON m.id = q.module_id
   WHERE m.course_id = _course_id;

  IF v_total_quizzes = 0 THEN
    INSERT INTO public.certificate_audit_log
      (user_id, course_id, outcome, reason, quizzes_required, quizzes_passed)
    VALUES
      (v_uid, _course_id, 'course_has_no_quizzes', 'Course has no quizzes defined', 0, 0);

    certificate_id := NULL;
    serial := NULL;
    issued_at := NULL;
    already_existed := false;
    outcome := 'course_has_no_quizzes';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT count(DISTINCT q.id) INTO v_passed_quizzes
    FROM public.quizzes q
    JOIN public.modules m ON m.id = q.module_id
    JOIN public.quiz_attempts a ON a.quiz_id = q.id
   WHERE m.course_id = _course_id
     AND a.user_id = v_uid
     AND a.passed = true;

  IF v_passed_quizzes < v_total_quizzes THEN
    INSERT INTO public.certificate_audit_log
      (user_id, course_id, outcome, reason, quizzes_required, quizzes_passed)
    VALUES
      (v_uid, _course_id, 'course_not_complete',
       format('%s of %s quizzes passed', v_passed_quizzes, v_total_quizzes),
       v_total_quizzes, v_passed_quizzes);

    certificate_id := NULL;
    serial := NULL;
    issued_at := NULL;
    already_existed := false;
    outcome := 'course_not_complete';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT c.id, c.serial, c.issued_at INTO v_existing
    FROM public.certificates c
   WHERE c.user_id = v_uid AND c.course_id = _course_id
   LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.certificate_audit_log
      (user_id, course_id, certificate_id, outcome, reason, quizzes_required, quizzes_passed)
    VALUES
      (v_uid, _course_id, v_existing.id, 'already_existed',
       'Certificate already issued for this course', v_total_quizzes, v_passed_quizzes);

    certificate_id := v_existing.id;
    serial := v_existing.serial;
    issued_at := v_existing.issued_at;
    already_existed := true;
    outcome := 'already_existed';
    RETURN NEXT;
    RETURN;
  END IF;

  v_serial := 'SKY-' || upper(translate(encode(gen_random_bytes(6), 'base64'), '+/=', 'xyz'));

  INSERT INTO public.certificates (user_id, course_id, serial)
  VALUES (v_uid, _course_id, v_serial)
  RETURNING id, certificates.serial, certificates.issued_at INTO v_new;

  INSERT INTO public.certificate_audit_log
    (user_id, course_id, certificate_id, outcome, reason, quizzes_required, quizzes_passed)
  VALUES
    (v_uid, _course_id, v_new.id, 'issued',
     format('All %s quizzes passed; certificate issued', v_total_quizzes),
     v_total_quizzes, v_passed_quizzes);

  certificate_id := v_new.id;
  serial := v_new.serial;
  issued_at := v_new.issued_at;
  already_existed := false;
  outcome := 'issued';
  RETURN NEXT;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.issue_certificate_if_complete(uuid) TO authenticated;
