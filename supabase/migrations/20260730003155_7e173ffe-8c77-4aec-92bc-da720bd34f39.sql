-- ===== extend existing quizzes to the brief's shape (additive) =====
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS curriculum_module_id uuid REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS questions_to_draw integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS shuffle_questions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shuffle_options boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS retake_cooldown_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.quizzes ALTER COLUMN pass_threshold SET DEFAULT 90;
UPDATE public.quizzes SET org_id = (SELECT id FROM public.organizations WHERE slug = 'skyportco') WHERE org_id IS NULL;

-- ===== extend existing quiz_questions =====
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS topic_tag text,
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'single' CHECK (question_type IN ('single','multi','true_false')),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.quiz_questions SET org_id = (SELECT id FROM public.organizations WHERE slug = 'skyportco') WHERE org_id IS NULL;

-- ===== quiz_options =====
CREATE TABLE public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  ordering integer NOT NULL DEFAULT 0,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_options TO service_role;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

-- ===== translations =====
CREATE TABLE public.quiz_question_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','es')),
  prompt text NOT NULL DEFAULT '',
  explanation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'machine' CHECK (status IN ('machine','reviewed','approved')),
  translated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, locale)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_question_translations TO authenticated;
GRANT ALL ON public.quiz_question_translations TO service_role;
ALTER TABLE public.quiz_question_translations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quiz_option_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.quiz_options(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','es')),
  label text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'machine' CHECK (status IN ('machine','reviewed','approved')),
  translated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (option_id, locale)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_option_translations TO authenticated;
GRANT ALL ON public.quiz_option_translations TO service_role;
ALTER TABLE public.quiz_option_translations ENABLE ROW LEVEL SECURITY;

-- ===== attempt-time persistence =====
CREATE TABLE public.quiz_attempt_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  ordering integer NOT NULL DEFAULT 0,
  option_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT ON public.quiz_attempt_questions TO authenticated;
GRANT ALL ON public.quiz_attempt_questions TO service_role;
ALTER TABLE public.quiz_attempt_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quiz_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  topic_tag text,
  selected_option_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT ON public.quiz_attempt_answers TO authenticated;
GRANT ALL ON public.quiz_attempt_answers TO service_role;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_quiz_options_updated BEFORE UPDATE ON public.quiz_options FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_qqt_updated BEFORE UPDATE ON public.quiz_question_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_qot_updated BEFORE UPDATE ON public.quiz_option_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();