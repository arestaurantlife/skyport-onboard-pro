-- ============ CURRICULA ============
CREATE TABLE public.curricula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outlet_id uuid REFERENCES public.outlets(id) ON DELETE SET NULL,
  job_role_key text,
  key text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  pass_threshold integer NOT NULL DEFAULT 90,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, key, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curricula TO authenticated;
GRANT ALL ON public.curricula TO service_role;
ALTER TABLE public.curricula ENABLE ROW LEVEL SECURITY;

-- ============ CURRICULUM MODULES ============
CREATE TABLE public.curriculum_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  curriculum_id uuid NOT NULL REFERENCES public.curricula(id) ON DELETE CASCADE,
  module_index integer NOT NULL,
  key text NOT NULL,
  estimated_minutes integer NOT NULL DEFAULT 30,
  is_required boolean NOT NULL DEFAULT true,
  pass_threshold integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (curriculum_id, module_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_modules TO authenticated;
GRANT ALL ON public.curriculum_modules TO service_role;
ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;

-- ============ CORE LIBRARY BLOCKS ============
CREATE TABLE public.core_library_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  block_type text NOT NULL CHECK (block_type IN ('text','video','image','callout','checklist','embed','quiz_ref')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  topic text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_library_blocks TO authenticated;
GRANT ALL ON public.core_library_blocks TO service_role;
ALTER TABLE public.core_library_blocks ENABLE ROW LEVEL SECURITY;

-- ============ CONTENT BLOCKS ============
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('core','org')),
  core_block_id uuid REFERENCES public.core_library_blocks(id) ON DELETE RESTRICT,
  block_type text NOT NULL CHECK (block_type IN ('text','video','image','callout','checklist','embed','quiz_ref')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_blocks_source_core_block_ck CHECK (
    (source = 'core' AND core_block_id IS NOT NULL)
    OR (source = 'org' AND core_block_id IS NULL)
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_blocks TO authenticated;
GRANT ALL ON public.content_blocks TO service_role;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- ============ TRANSLATION SIDECARS ============
CREATE TABLE public.core_library_block_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  core_library_block_id uuid NOT NULL REFERENCES public.core_library_blocks(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','es')),
  title text NOT NULL DEFAULT '',
  body_markdown text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'machine' CHECK (status IN ('machine','reviewed','approved')),
  translated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (core_library_block_id, locale)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.core_library_block_translations TO authenticated;
GRANT ALL ON public.core_library_block_translations TO service_role;
ALTER TABLE public.core_library_block_translations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.content_block_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_block_id uuid NOT NULL REFERENCES public.content_blocks(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','es')),
  title text NOT NULL DEFAULT '',
  body_markdown text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'machine' CHECK (status IN ('machine','reviewed','approved')),
  translated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_block_id, locale)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_block_translations TO authenticated;
GRANT ALL ON public.content_block_translations TO service_role;
ALTER TABLE public.content_block_translations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.curriculum_module_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_module_id uuid NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','es')),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'machine' CHECK (status IN ('machine','reviewed','approved')),
  translated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (curriculum_module_id, locale)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_module_translations TO authenticated;
GRANT ALL ON public.curriculum_module_translations TO service_role;
ALTER TABLE public.curriculum_module_translations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.job_role_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_role_id uuid NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  locale text NOT NULL CHECK (locale IN ('en','es')),
  label text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'machine' CHECK (status IN ('machine','reviewed','approved')),
  translated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_role_id, locale)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_role_translations TO authenticated;
GRANT ALL ON public.job_role_translations TO service_role;
ALTER TABLE public.job_role_translations ENABLE ROW LEVEL SECURITY;

-- ============ updated_at triggers ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_curricula_updated BEFORE UPDATE ON public.curricula FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_curriculum_modules_updated BEFORE UPDATE ON public.curriculum_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_core_library_blocks_updated BEFORE UPDATE ON public.core_library_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_content_blocks_updated BEFORE UPDATE ON public.content_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clbt_updated BEFORE UPDATE ON public.core_library_block_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cbt_updated BEFORE UPDATE ON public.content_block_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cmt_updated BEFORE UPDATE ON public.curriculum_module_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_jrt_updated BEFORE UPDATE ON public.job_role_translations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();