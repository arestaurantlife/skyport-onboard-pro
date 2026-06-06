import { supabase } from "@/integrations/supabase/client";

export async function loadCourseTree(courseId: string) {
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, outlet_id, job_role, outlets(name, manager_name, brand_description, hours)")
    .eq("id", courseId)
    .maybeSingle();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, day_number, order_idx, title, description")
    .eq("course_id", courseId)
    .order("order_idx");

  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, module_id, order_idx, title, video_url, body_markdown, estimated_minutes")
    .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_idx");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id, title, pass_threshold")
    .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

  const tree = (modules ?? []).map((m) => ({
    ...m,
    chapters: (chapters ?? []).filter((c) => c.module_id === m.id),
    quizzes: (quizzes ?? []).filter((q) => q.module_id === m.id),
  }));

  return { course, modules: tree };
}

export async function loadMyProgress(userId: string, chapterIds: string[], quizIds: string[]) {
  const { data: chProg } = await supabase
    .from("chapter_progress")
    .select("chapter_id")
    .eq("user_id", userId)
    .in("chapter_id", chapterIds.length ? chapterIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, passed, score")
    .eq("user_id", userId)
    .in("quiz_id", quizIds.length ? quizIds : ["00000000-0000-0000-0000-000000000000"]);

  const completedChapters = new Set((chProg ?? []).map((c) => c.chapter_id));
  const passedQuizzes = new Set((attempts ?? []).filter((a) => a.passed).map((a) => a.quiz_id));
  return { completedChapters, passedQuizzes };
}