import { supabase } from "@/integrations/supabase/client";
import type { JobRole } from "@/lib/training-helpers";

export type CourseImportQuestion = {
  prompt: string;
  choices: string[];
  correct_index: number;
};

export type CourseImportChapter = {
  title: string;
  body_markdown?: string;
  video_url?: string | null;
  estimated_minutes?: number;
};

export type CourseImportModule = {
  title: string;
  description?: string;
  chapters?: CourseImportChapter[];
  quiz?: {
    title?: string;
    pass_threshold?: number;
    questions?: CourseImportQuestion[];
  } | null;
};

export type CourseImport = {
  title: string;
  description?: string;
  job_role: JobRole;
  outlet_id?: string | null;
  modules?: CourseImportModule[];
};

export const COURSE_IMPORT_TEMPLATE: CourseImport = {
  title: "Server Onboarding — Mesa Verde Cantina",
  description: "Role-specific onboarding for new servers.",
  job_role: "server",
  outlet_id: null,
  modules: [
    {
      title: "Welcome & Brand Standards",
      description: "Who we are and how we serve guests.",
      chapters: [
        {
          title: "Our story",
          body_markdown: "## Welcome\n\nWrite the lesson content here in markdown.",
          video_url: null,
          estimated_minutes: 10,
        },
      ],
      quiz: {
        title: "Module 1 Check",
        pass_threshold: 90,
        questions: [
          {
            prompt: "What is our first priority with every guest?",
            choices: ["Speed", "Safety and hospitality", "Upselling", "Paperwork"],
            correct_index: 1,
          },
        ],
      },
    },
  ],
};

export function validateCourseImport(raw: unknown): CourseImport {
  if (!raw || typeof raw !== "object") throw new Error("The file must contain a JSON object.");
  const c = raw as Record<string, unknown>;
  if (typeof c.title !== "string" || !c.title.trim()) throw new Error("`title` is required.");
  if (typeof c.job_role !== "string" || !c.job_role.trim()) throw new Error("`job_role` is required.");
  const mods = Array.isArray(c.modules) ? c.modules : [];
  mods.forEach((m, i) => {
    const mm = m as CourseImportModule;
    if (!mm || typeof mm.title !== "string" || !mm.title.trim())
      throw new Error(`Module ${i + 1} is missing a title.`);
    (mm.chapters ?? []).forEach((ch, j) => {
      if (!ch || typeof ch.title !== "string" || !ch.title.trim())
        throw new Error(`Module ${i + 1}, chapter ${j + 1} is missing a title.`);
    });
    (mm.quiz?.questions ?? []).forEach((q, j) => {
      if (!q || typeof q.prompt !== "string" || !q.prompt.trim())
        throw new Error(`Module ${i + 1}, question ${j + 1} is missing a prompt.`);
      if (!Array.isArray(q.choices) || q.choices.length < 2)
        throw new Error(`Module ${i + 1}, question ${j + 1} needs at least two answer choices.`);
      if (
        typeof q.correct_index !== "number" ||
        q.correct_index < 0 ||
        q.correct_index >= q.choices.length
      )
        throw new Error(`Module ${i + 1}, question ${j + 1} has an invalid correct answer index.`);
    });
  });
  return { ...(c as unknown as CourseImport), modules: mods as CourseImportModule[] };
}

/** Creates a full course tree (course → modules → chapters → quizzes → questions). */
export async function importCourse(input: CourseImport) {
  const course = validateCourseImport(input);

  const { data: createdCourse, error: courseErr } = await supabase
    .from("courses")
    .insert({
      title: course.title.trim(),
      description: course.description?.trim() || "",
      job_role: course.job_role,
      outlet_id: course.outlet_id || null,
    })
    .select("id")
    .single();
  if (courseErr || !createdCourse) throw new Error(courseErr?.message ?? "Could not create the course.");

  let moduleIndex = 0;
  for (const m of course.modules ?? []) {
    moduleIndex += 1;
    const { data: createdModule, error: modErr } = await supabase
      .from("modules")
      .insert({
        course_id: createdCourse.id,
        title: m.title.trim(),
        description: m.description?.trim() || "",
        day_number: moduleIndex,
        order_idx: moduleIndex,
      })
      .select("id")
      .single();
    if (modErr || !createdModule) throw new Error(modErr?.message ?? "Could not create a module.");

    const chapters = (m.chapters ?? []).map((ch, idx) => ({
      module_id: createdModule.id,
      title: ch.title.trim(),
      body_markdown: ch.body_markdown ?? "",
      video_url: ch.video_url || null,
      estimated_minutes: ch.estimated_minutes ?? 10,
      order_idx: idx + 1,
    }));
    if (chapters.length) {
      const { error } = await supabase.from("chapters").insert(chapters);
      if (error) throw new Error(error.message);
    }

    const questions = m.quiz?.questions ?? [];
    if (m.quiz && questions.length) {
      const { data: createdQuiz, error: quizErr } = await supabase
        .from("quizzes")
        .insert({
          module_id: createdModule.id,
          title: m.quiz.title?.trim() || `${m.title.trim()} Quiz`,
          pass_threshold: m.quiz.pass_threshold ?? 90,
          questions_to_draw: questions.length,
        })
        .select("id")
        .single();
      if (quizErr || !createdQuiz) throw new Error(quizErr?.message ?? "Could not create a quiz.");

      const { error } = await supabase.from("quiz_questions").insert(
        questions.map((q, idx) => ({
          quiz_id: createdQuiz.id,
          prompt: q.prompt.trim(),
          choices: q.choices,
          correct_index: q.correct_index,
          order_idx: idx + 1,
        })),
      );
      if (error) throw new Error(error.message);
    }
  }

  return createdCourse.id;
}

/** Reads a course back out in the same JSON shape, for editing or duplication. */
export async function exportCourse(courseId: string): Promise<CourseImport> {
  const { data: course } = await supabase
    .from("courses")
    .select("title, description, job_role, outlet_id")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) throw new Error("Course not found.");

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, description, order_idx")
    .eq("course_id", courseId)
    .order("order_idx");
  const moduleIds = (modules ?? []).map((m) => m.id);
  const fallback = ["00000000-0000-0000-0000-000000000000"];

  const { data: chapters } = await supabase
    .from("chapters")
    .select("module_id, title, body_markdown, video_url, estimated_minutes, order_idx")
    .in("module_id", moduleIds.length ? moduleIds : fallback)
    .order("order_idx");

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, module_id, title, pass_threshold")
    .in("module_id", moduleIds.length ? moduleIds : fallback);

  const quizIds = (quizzes ?? []).map((q) => q.id);
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("quiz_id, prompt, choices, correct_index, order_idx")
    .in("quiz_id", quizIds.length ? quizIds : fallback)
    .order("order_idx");

  return {
    title: course.title,
    description: course.description,
    job_role: course.job_role as JobRole,
    outlet_id: course.outlet_id,
    modules: (modules ?? []).map((m) => {
      const quiz = (quizzes ?? []).find((q) => q.module_id === m.id);
      return {
        title: m.title,
        description: m.description,
        chapters: (chapters ?? [])
          .filter((c) => c.module_id === m.id)
          .map((c) => ({
            title: c.title,
            body_markdown: c.body_markdown,
            video_url: c.video_url,
            estimated_minutes: c.estimated_minutes,
          })),
        quiz: quiz
          ? {
              title: quiz.title,
              pass_threshold: quiz.pass_threshold,
              questions: (questions ?? [])
                .filter((q) => q.quiz_id === quiz.id)
                .map((q) => ({
                  prompt: q.prompt,
                  choices: (q.choices as string[]) ?? [],
                  correct_index: q.correct_index,
                })),
            }
          : null,
      };
    }),
  };
}

export async function deleteCourse(courseId: string) {
  const { data: modules } = await supabase.from("modules").select("id").eq("course_id", courseId);
  const moduleIds = (modules ?? []).map((m) => m.id);
  if (moduleIds.length) {
    const { data: quizzes } = await supabase.from("quizzes").select("id").in("module_id", moduleIds);
    const quizIds = (quizzes ?? []).map((q) => q.id);
    if (quizIds.length) {
      await supabase.from("quiz_questions").delete().in("quiz_id", quizIds);
      await supabase.from("quizzes").delete().in("id", quizIds);
    }
    await supabase.from("chapters").delete().in("module_id", moduleIds);
    await supabase.from("modules").delete().in("id", moduleIds);
  }
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw new Error(error.message);
}