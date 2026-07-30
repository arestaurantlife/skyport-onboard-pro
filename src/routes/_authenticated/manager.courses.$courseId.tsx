import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, HelpCircle, Plus, Trash2 } from "lucide-react";
import { getCurrentProfile } from "@/lib/training-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manager/courses/$courseId")({
  head: () => ({
    meta: [
      { title: "Edit Course Content — Skyportco Training" },
      {
        name: "description",
        content: "Add training modules, lesson chapters and quiz questions to a Skyportco onboarding course.",
      },
      { property: "og:title", content: "Edit Course Content — Skyportco Training" },
      {
        property: "og:description",
        content: "Add modules, lesson chapters and quiz questions to an onboarding course.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditCourse,
});

function EditCourse() {
  const { courseId } = Route.useParams();
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });

  const { data: tree } = useQuery({
    queryKey: ["author-course", courseId],
    queryFn: async () => {
      const { data: course } = await supabase
        .from("courses")
        .select("id, title, description, job_role")
        .eq("id", courseId)
        .maybeSingle();
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, description, order_idx")
        .eq("course_id", courseId)
        .order("order_idx");
      const ids = (modules ?? []).map((m) => m.id);
      const fb = ["00000000-0000-0000-0000-000000000000"];
      const { data: chapters } = await supabase
        .from("chapters")
        .select("id, module_id, title, estimated_minutes, order_idx")
        .in("module_id", ids.length ? ids : fb)
        .order("order_idx");
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, module_id, title, pass_threshold")
        .in("module_id", ids.length ? ids : fb);
      const quizIds = (quizzes ?? []).map((q) => q.id);
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("id, quiz_id, prompt, order_idx")
        .in("quiz_id", quizIds.length ? quizIds : fb)
        .order("order_idx");
      return { course, modules: modules ?? [], chapters: chapters ?? [], quizzes: quizzes ?? [], questions: questions ?? [] };
    },
  });

  const [moduleTitle, setModuleTitle] = useState("");
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [chTitle, setChTitle] = useState("");
  const [chBody, setChBody] = useState("");
  const [chVideo, setChVideo] = useState("");
  const [chMinutes, setChMinutes] = useState("10");
  const [qPrompt, setQPrompt] = useState("");
  const [qChoices, setQChoices] = useState("");
  const [qCorrect, setQCorrect] = useState("1");
  const [busy, setBusy] = useState(false);

  const isAuthorized = me?.roles.includes("manager") || me?.roles.includes("admin");
  if (!me) return null;
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold">Manager access only</h1>
          <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </div>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["author-course", courseId] });

  const addModule = async () => {
    if (!moduleTitle.trim()) { toast.error("Give the module a title"); return; }
    setBusy(true);
    const next = (tree?.modules.length ?? 0) + 1;
    const { error } = await supabase.from("modules").insert({
      course_id: courseId, title: moduleTitle.trim(), description: "",
      order_idx: next, day_number: next,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setModuleTitle("");
    toast.success(`Module ${next} added`);
    refresh();
  };

  const addChapter = async (moduleId: string) => {
    if (!chTitle.trim()) { toast.error("Give the chapter a title"); return; }
    setBusy(true);
    const count = (tree?.chapters.filter((c) => c.module_id === moduleId).length ?? 0) + 1;
    const { error } = await supabase.from("chapters").insert({
      module_id: moduleId,
      title: chTitle.trim(),
      body_markdown: chBody,
      video_url: chVideo.trim() || null,
      estimated_minutes: Number(chMinutes) || 10,
      order_idx: count,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setChTitle(""); setChBody(""); setChVideo("");
    toast.success("Chapter added");
    refresh();
  };

  const addQuestion = async (moduleId: string) => {
    const choices = qChoices.split("\n").map((s) => s.trim()).filter(Boolean);
    const correct = Number(qCorrect);
    if (!qPrompt.trim()) { toast.error("Write the question"); return; }
    if (choices.length < 2) { toast.error("Add at least two answer choices, one per line"); return; }
    if (!correct || correct < 1 || correct > choices.length) { toast.error("Pick a valid correct-answer number"); return; }
    setBusy(true);
    let quiz = tree?.quizzes.find((q) => q.module_id === moduleId);
    if (!quiz) {
      const moduleTitleText = tree?.modules.find((m) => m.id === moduleId)?.title ?? "Module";
      const { data, error } = await supabase.from("quizzes").insert({
        module_id: moduleId, title: `${moduleTitleText} Quiz`, pass_threshold: 90,
      }).select("id, module_id, title, pass_threshold").single();
      if (error || !data) { setBusy(false); toast.error(error?.message ?? "Could not create the quiz"); return; }
      quiz = data;
    }
    const order = (tree?.questions.filter((q) => q.quiz_id === quiz!.id).length ?? 0) + 1;
    const { error } = await supabase.from("quiz_questions").insert({
      quiz_id: quiz.id, prompt: qPrompt.trim(), choices, correct_index: correct - 1, order_idx: order,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setQPrompt(""); setQChoices(""); setQCorrect("1");
    toast.success("Question added");
    refresh();
  };

  const removeModule = async (moduleId: string, title: string) => {
    if (!window.confirm(`Delete module “${title}” with its chapters and quiz?`)) return;
    const quizIds = (tree?.quizzes ?? []).filter((q) => q.module_id === moduleId).map((q) => q.id);
    if (quizIds.length) {
      await supabase.from("quiz_questions").delete().in("quiz_id", quizIds);
      await supabase.from("quizzes").delete().in("id", quizIds);
    }
    await supabase.from("chapters").delete().eq("module_id", moduleId);
    const { error } = await supabase.from("modules").delete().eq("id", moduleId);
    if (error) { toast.error(error.message); return; }
    toast.success("Module deleted");
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tree?.course?.title ?? "Course"}</h1>
            <p className="mt-1 text-muted-foreground">{tree?.course?.description}</p>
          </div>
          <Button asChild variant="outline"><Link to="/manager/courses">All courses</Link></Button>
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <Label>Add a module</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Module title, e.g. Food Safety Fundamentals" />
            <Button onClick={addModule} disabled={busy}><Plus className="mr-1 h-4 w-4" />Add module</Button>
          </div>
        </section>

        <div className="mt-6 space-y-4">
          {(tree?.modules ?? []).map((m, i) => {
            const chapters = (tree?.chapters ?? []).filter((c) => c.module_id === m.id);
            const quiz = (tree?.quizzes ?? []).find((q) => q.module_id === m.id);
            const questions = (tree?.questions ?? []).filter((q) => quiz && q.quiz_id === quiz.id);
            const isOpen = openModule === m.id;
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">Module {i + 1} · {m.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{chapters.length} chapters</Badge>
                      <Badge variant="secondary">{questions.length} quiz questions</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={isOpen ? "secondary" : "outline"} onClick={() => setOpenModule(isOpen ? null : m.id)}>
                      {isOpen ? "Close" : "Add content"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeModule(m.id, m.title)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {chapters.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {chapters.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />{c.title}
                        <span className="text-xs">· {c.estimated_minutes} min</span>
                      </li>
                    ))}
                  </ul>
                )}
                {questions.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {questions.map((q) => (
                      <li key={q.id} className="flex items-center gap-2">
                        <HelpCircle className="h-3 w-3" />{q.prompt}
                      </li>
                    ))}
                  </ul>
                )}

                {isOpen && (
                  <div className="mt-4 grid gap-5 border-t border-border pt-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold">New chapter</h3>
                      <div className="mt-2 space-y-2">
                        <Input value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="Chapter title" />
                        <Textarea rows={5} value={chBody} onChange={(e) => setChBody(e.target.value)} placeholder="Lesson content (markdown supported)" />
                        <Input value={chVideo} onChange={(e) => setChVideo(e.target.value)} placeholder="Video URL (optional)" />
                        <Input value={chMinutes} onChange={(e) => setChMinutes(e.target.value)} inputMode="numeric" placeholder="Estimated minutes" />
                        <Button className="w-full" onClick={() => addChapter(m.id)} disabled={busy}>Add chapter</Button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">New quiz question</h3>
                      <div className="mt-2 space-y-2">
                        <Textarea rows={2} value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} placeholder="Question" />
                        <Textarea rows={4} value={qChoices} onChange={(e) => setQChoices(e.target.value)} placeholder={"One answer choice per line"} />
                        <Input value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} inputMode="numeric" placeholder="Correct choice number (1, 2, 3…)" />
                        <Button className="w-full" onClick={() => addQuestion(m.id)} disabled={busy}>Add question</Button>
                        <p className="text-xs text-muted-foreground">Passing score is 90%. Answers are never shown to trainees.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {(tree?.modules ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No modules yet — add the first one above.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}