
-- =====================================================================
-- 1. Privilege escalation fix: drop user_roles self-insert
-- =====================================================================
DROP POLICY IF EXISTS "Users can self-insert their role" ON public.user_roles;
-- handle_new_user trigger (SECURITY DEFINER) still inserts the default 'employee' role.

-- =====================================================================
-- 2. Invites: lock down public SELECT, expose via server-side functions
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can read invite by code for validation" ON public.invites;
DROP POLICY IF EXISTS "Authenticated can claim invite for self" ON public.invites;

CREATE POLICY "Managers and admins can view invites"
  ON public.invites
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

-- Validate an invite without exposing the table. Returns one row or none.
CREATE OR REPLACE FUNCTION public.validate_invite(_code text)
RETURNS TABLE (id uuid, outlet_id uuid, job_role job_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.outlet_id, i.job_role
  FROM public.invites i
  WHERE upper(i.code) = upper(_code)
    AND i.used_by IS NULL
    AND i.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite(text) TO anon, authenticated;

-- Atomically claim an invite for the caller and apply outlet/role to their profile.
CREATE OR REPLACE FUNCTION public.claim_invite(_code text)
RETURNS TABLE (outlet_id uuid, job_role job_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invite record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT i.id, i.outlet_id, i.job_role
    INTO v_invite
    FROM public.invites i
   WHERE upper(i.code) = upper(_code)
     AND i.used_by IS NULL
     AND i.expires_at > now()
   FOR UPDATE
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_invite';
  END IF;

  UPDATE public.invites
     SET used_by = v_uid, used_at = now()
   WHERE id = v_invite.id;

  UPDATE public.profiles
     SET outlet_id = v_invite.outlet_id,
         job_role = v_invite.job_role
   WHERE id = v_uid;

  outlet_id := v_invite.outlet_id;
  job_role := v_invite.job_role;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;

-- =====================================================================
-- 3. Quiz questions: hide correct_index, server-side grading
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated can view quiz questions" ON public.quiz_questions;

CREATE POLICY "Managers and admins can view quiz questions"
  ON public.quiz_questions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

-- Public-safe question fetch (no correct_index)
CREATE OR REPLACE FUNCTION public.get_quiz_questions(_quiz_id uuid)
RETURNS TABLE (id uuid, prompt text, choices jsonb, order_idx integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.prompt, q.choices, q.order_idx
  FROM public.quiz_questions q
  WHERE q.quiz_id = _quiz_id
  ORDER BY q.order_idx;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;

-- Server-side grading: caller submits answers, server compares to correct_index,
-- inserts attempt, and returns score/passed without ever leaking the answer key.
-- _answers shape: { "<question_id>": <choice_index>, ... }
CREATE OR REPLACE FUNCTION public.grade_quiz(_quiz_id uuid, _answers jsonb)
RETURNS TABLE (score integer, passed boolean, attempt_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total integer;
  v_correct integer := 0;
  v_score integer;
  v_threshold integer;
  v_passed boolean;
  v_attempt_id uuid;
  v_answers_array jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF jsonb_typeof(_answers) <> 'object' THEN
    RAISE EXCEPTION 'invalid_answers';
  END IF;

  SELECT pass_threshold INTO v_threshold FROM public.quizzes WHERE id = _quiz_id;
  IF v_threshold IS NULL THEN
    RAISE EXCEPTION 'quiz_not_found';
  END IF;

  SELECT count(*) INTO v_total FROM public.quiz_questions WHERE quiz_id = _quiz_id;
  IF v_total = 0 THEN
    RAISE EXCEPTION 'quiz_has_no_questions';
  END IF;

  SELECT count(*)::int INTO v_correct
    FROM public.quiz_questions q
   WHERE q.quiz_id = _quiz_id
     AND (_answers ->> q.id::text)::int = q.correct_index;

  v_score := round((v_correct::numeric / v_total::numeric) * 100)::int;
  v_passed := v_score >= v_threshold;

  -- Normalize answers into the array shape the table already stores.
  SELECT coalesce(jsonb_agg(jsonb_build_object('question_id', key, 'answer_index', value)), '[]'::jsonb)
    INTO v_answers_array
    FROM jsonb_each(_answers);

  INSERT INTO public.quiz_attempts (user_id, quiz_id, score, passed, answers)
  VALUES (v_uid, _quiz_id, v_score, v_passed, v_answers_array)
  RETURNING id INTO v_attempt_id;

  score := v_score;
  passed := v_passed;
  attempt_id := v_attempt_id;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grade_quiz(uuid, jsonb) TO authenticated;
