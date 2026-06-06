
-- 1. Remove client-side INSERT path on certificates
DROP POLICY IF EXISTS "Users insert own certificate" ON public.certificates;

-- 2. Server-verified issuance
CREATE OR REPLACE FUNCTION public.issue_certificate_if_complete(_course_id uuid)
RETURNS TABLE (certificate_id uuid, serial text, issued_at timestamptz, already_existed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- All quizzes in this course
  SELECT count(*)
    INTO v_total_quizzes
    FROM public.quizzes q
    JOIN public.modules m ON m.id = q.module_id
   WHERE m.course_id = _course_id;

  IF v_total_quizzes = 0 THEN
    RAISE EXCEPTION 'course_has_no_quizzes';
  END IF;

  -- Distinct quizzes the caller has at least one passing attempt for
  SELECT count(DISTINCT q.id)
    INTO v_passed_quizzes
    FROM public.quizzes q
    JOIN public.modules m ON m.id = q.module_id
    JOIN public.quiz_attempts a ON a.quiz_id = q.id
   WHERE m.course_id = _course_id
     AND a.user_id = v_uid
     AND a.passed = true;

  IF v_passed_quizzes < v_total_quizzes THEN
    RAISE EXCEPTION 'course_not_complete';
  END IF;

  -- Idempotent: return existing certificate if any
  SELECT c.id, c.serial, c.issued_at
    INTO v_existing
    FROM public.certificates c
   WHERE c.user_id = v_uid AND c.course_id = _course_id
   LIMIT 1;

  IF FOUND THEN
    certificate_id := v_existing.id;
    serial := v_existing.serial;
    issued_at := v_existing.issued_at;
    already_existed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Cryptographically strong serial
  v_serial := 'SKY-' || upper(translate(encode(gen_random_bytes(6), 'base64'), '+/=', 'xyz'));

  INSERT INTO public.certificates (user_id, course_id, serial)
  VALUES (v_uid, _course_id, v_serial)
  RETURNING id, certificates.serial, certificates.issued_at INTO v_new;

  certificate_id := v_new.id;
  serial := v_new.serial;
  issued_at := v_new.issued_at;
  already_existed := false;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_certificate_if_complete(uuid) TO authenticated;
