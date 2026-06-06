/**
 * Seed test users and per-outlet course clones for CI / Playwright.
 *
 * Run:  bun scripts/seed-test-users.ts
 *
 * Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Idempotent: re-running reuses existing auth users and skips existing course clones.
 */
import { createClient } from "@supabase/supabase-js";
import { TEST_USERS, OUTLETS } from "../tests/e2e/fixtures/test-users";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SOURCE_OUTLET_ID = OUTLETS.mesaVerde.id;

async function findUserByEmail(email: string): Promise<string | null> {
  // Paginate auth.admin.listUsers (max 1000 per page is plenty here)
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function cloneCourseForOutlet(outletId: string, newTitle: string) {
  // Skip if a course with this title already exists for the outlet
  const { data: existing, error: existingErr } = await admin
    .from("courses")
    .select("id")
    .eq("outlet_id", outletId)
    .eq("title", newTitle)
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existing) {
    console.log(`  ↺ Course already exists for outlet ${outletId} (${newTitle})`);
    return existing.id as string;
  }

  // Load source course
  const { data: source, error: srcErr } = await admin
    .from("courses")
    .select("*")
    .eq("outlet_id", SOURCE_OUTLET_ID)
    .limit(1)
    .single();
  if (srcErr) throw srcErr;

  const { data: newCourse, error: newCourseErr } = await admin
    .from("courses")
    .insert({
      title: newTitle,
      description: source.description,
      outlet_id: outletId,
      passing_score: source.passing_score ?? null,
    })
    .select("id")
    .single();
  if (newCourseErr) throw newCourseErr;
  const newCourseId = newCourse.id as string;

  // Modules
  const { data: modules, error: modErr } = await admin
    .from("modules")
    .select("*")
    .eq("course_id", source.id)
    .order("order_index", { ascending: true });
  if (modErr) throw modErr;

  for (const m of modules ?? []) {
    const { data: newMod, error: nmErr } = await admin
      .from("modules")
      .insert({
        course_id: newCourseId,
        title: m.title,
        description: m.description,
        order_index: m.order_index,
      })
      .select("id")
      .single();
    if (nmErr) throw nmErr;

    const { data: chapters, error: chErr } = await admin
      .from("chapters")
      .select("*")
      .eq("module_id", m.id)
      .order("order_index", { ascending: true });
    if (chErr) throw chErr;

    for (const c of chapters ?? []) {
      const { data: newChap, error: ncErr } = await admin
        .from("chapters")
        .insert({
          module_id: newMod.id,
          title: c.title,
          content: c.content,
          video_url: c.video_url,
          order_index: c.order_index,
          duration_minutes: c.duration_minutes,
        })
        .select("id")
        .single();
      if (ncErr) throw ncErr;

      const { data: quizzes, error: qzErr } = await admin
        .from("quizzes")
        .select("*")
        .eq("chapter_id", c.id);
      if (qzErr) throw qzErr;

      for (const q of quizzes ?? []) {
        const { data: newQuiz, error: nqErr } = await admin
          .from("quizzes")
          .insert({
            chapter_id: newChap.id,
            title: q.title,
            passing_score: q.passing_score,
          })
          .select("id")
          .single();
        if (nqErr) throw nqErr;

        const { data: questions, error: qErr } = await admin
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", q.id)
          .order("order_index", { ascending: true });
        if (qErr) throw qErr;

        if (questions && questions.length > 0) {
          const { error: insQErr } = await admin.from("quiz_questions").insert(
            questions.map((qq) => ({
              quiz_id: newQuiz.id,
              question: qq.question,
              options: qq.options,
              correct_answer: qq.correct_answer,
              order_index: qq.order_index,
            })),
          );
          if (insQErr) throw insQErr;
        }
      }
    }
  }

  console.log(`  ✓ Cloned course → ${newTitle}`);
  return newCourseId;
}

async function upsertTestUser(fixture: typeof TEST_USERS[number]) {
  let userId = await findUserByEmail(fixture.email);
  let createdNow = false;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: fixture.email,
      password: fixture.password,
      email_confirm: true,
      user_metadata: { full_name: fixture.fullName },
    });
    if (error) throw error;
    userId = data.user.id;
    createdNow = true;
  }

  // Profile upsert (handle_new_user trigger may have created a baseline row)
  const { error: profErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: fixture.fullName,
        email: fixture.email,
        outlet_id: fixture.outletId,
        job_role: fixture.jobRole,
        is_test_account: true,
      },
      { onConflict: "id" },
    );
  if (profErr) throw profErr;

  // Role: ensure exactly the desired role exists (clear any defaults the trigger added)
  const { error: delErr } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw delErr;
  const { error: roleErr } = await admin
    .from("user_roles")
    .insert({ user_id: userId, role: fixture.role });
  if (roleErr) throw roleErr;

  console.log(
    `  ${createdNow ? "✓ created" : "↺ reused "} ${fixture.email.padEnd(40)} role=${fixture.role.padEnd(8)} outlet=${fixture.outletName}`,
  );
}

async function main() {
  console.log("Cloning courses per outlet...");
  await cloneCourseForOutlet(OUTLETS.altitudeBurger.id, OUTLETS.altitudeBurger.courseTitle);
  await cloneCourseForOutlet(OUTLETS.rockyBrew.id, OUTLETS.rockyBrew.courseTitle);

  console.log("\nSeeding test users...");
  for (const fixture of TEST_USERS) {
    await upsertTestUser(fixture);
  }

  console.log(`\nDone. ${TEST_USERS.length} test users ready.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});