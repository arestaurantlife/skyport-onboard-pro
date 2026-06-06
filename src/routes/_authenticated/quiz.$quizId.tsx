import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadCourseTree, loadMyProgress } from "@/lib/course-data";
import { SiteHeader } from "@/components/SiteHeader";
import { CourseSidebar } from "@/components/CourseSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { shortSerial } from "@/lib/training-helpers";

export const Route = createFileRoute("/_authenticated/quiz/$quizId")({
  component: QuizPage,
});

type Question = { id: string; prompt: string; choices: string[]; order_idx: number };

function QuizPage() {
  const { quizId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<{ score: number; passed: boolean } | null>(null);

  const { data: quiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, pass_threshold, module_id, modules(course_id, day_number, title)")
        .eq("id", quizId)
        .maybeSingle();
      return data;
    },
  });

  const courseId = quiz?.modules?.course_id;

  const { data: questions } = useQuery({
    queryKey: ["quiz-questions", quizId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc("get_quiz_questions", { _quiz_id: quizId });
      return ((data ?? []) as Array<{ id: string; prompt: string; choices: unknown; order_idx: number }>)
        .map((q) => ({ id: q.id, prompt: q.prompt, choices: q.choices as string[], order_idx: q.order_idx })) as Question[];
    },
  });

  const { data: tree } = useQuery({
    queryKey: ["course-tree", courseId],
    enabled: !!courseId,
    queryFn: () => loadCourseTree(courseId!),
  });

  const { data: prog } = useQuery({
    queryKey: ["course-progress", courseId],
    enabled: !!tree,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { completedChapters: new Set<string>(), passedQuizzes: new Set<string>() };
      const cids = (tree?.modules ?? []).flatMap((m) => m.chapters.map((c) => c.id));
      const qids = (tree?.modules ?? []).flatMap((m) => m.quizzes.map((q) => q.id));
      return loadMyProgress(u.user.id, cids, qids);
    },
  });

  if (!quiz || !questions || !tree) return <div className="p-10 text-muted-foreground">Loading...</div>;

  const submit = async () => {
    // Server-side grading: correct answers are never sent to the client.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: gradeRows, error: gradeErr } = await (supabase as any).rpc("grade_quiz", {
      _quiz_id: quiz.id,
      _answers: answers,
    });
    if (gradeErr || !gradeRows || gradeRows.length === 0) {
      toast.error(gradeErr?.message ?? "Could not submit quiz. Please try again.");
      return;
    }
    const { score, passed } = gradeRows[0] as { score: number; passed: boolean };
    setSubmitted({ score, passed });

    const { data: u } = await supabase.auth.getUser();
    if (u.user && passed) {
        await qc.invalidateQueries({ queryKey: ["course-progress", courseId] });
        // check if this completes the course (all quizzes passed) → issue certificate
        const allQuizIds = tree.modules.flatMap((m) => m.quizzes.map((q) => q.id));
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("quiz_id, passed")
          .eq("user_id", u.user.id)
          .in("quiz_id", allQuizIds);
        const passedSet = new Set((attempts ?? []).filter((a) => a.passed).map((a) => a.quiz_id));
        if (allQuizIds.every((id) => passedSet.has(id))) {
          const { data: existing } = await supabase
            .from("certificates")
            .select("id")
            .eq("user_id", u.user.id)
            .eq("course_id", courseId!)
            .maybeSingle();
          if (!existing) {
            await supabase.from("certificates").insert({
              user_id: u.user.id,
              course_id: courseId!,
              serial: shortSerial(),
            });
            toast.success("🎓 Certificate of completion issued!");
          }
        }
    }
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(null);
  };

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex flex-col md:flex-row">
        <CourseSidebar
          courseId={courseId!}
          modules={tree.modules}
          completedChapters={prog?.completedChapters ?? new Set()}
          passedQuizzes={prog?.passedQuizzes ?? new Set()}
        />
        <main className="flex-1">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {quiz.modules?.day_number === 0 ? "Orientation" : `Day ${quiz.modules?.day_number}`} · Quiz
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{quiz.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Pass with {quiz.pass_threshold}% or higher. You can retake unlimited times.</p>

            {submitted && (
              <div className={cn("mt-6 rounded-xl border p-6", submitted.passed ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5")}>
                <div className="flex items-center gap-3">
                  {submitted.passed ? <CheckCircle2 className="h-8 w-8 text-primary" /> : <XCircle className="h-8 w-8 text-destructive" />}
                  <div>
                    <p className="text-xl font-bold">{submitted.passed ? "Passed!" : "Not quite — review and try again."}</p>
                    <p className="text-sm text-muted-foreground">Your score: {submitted.score}%</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={reset}><RotateCcw className="mr-1 h-4 w-4" />Retake</Button>
                  {submitted.passed && (
                    <Button onClick={() => navigate({ to: "/courses/$courseId", params: { courseId: courseId! } })}>
                      Back to course<ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            <ol className="mt-8 space-y-6">
              {questions.map((q, i) => (
                <li key={q.id} className="rounded-xl border border-border bg-card p-6">
                  <p className="flex items-baseline gap-2 font-medium">
                    <span className="text-sm font-bold text-muted-foreground">Q{i + 1}.</span>
                    <span>{q.prompt}</span>
                  </p>
                  <div className="mt-4 grid gap-2">
                    {q.choices.map((c, ci) => {
                      const selected = answers[q.id] === ci;
                      // After submission we only know the user's score, not the answer key
                      // (kept server-side). Highlight just the user's choice.
                      const showCorrect = false;
                      const showWrong = submitted && selected && !submitted.passed;
                      return (
                        <button
                          type="button"
                          key={ci}
                          disabled={!!submitted}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                          className={cn(
                            "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                            !submitted && selected && "border-primary bg-primary/10",
                            !submitted && !selected && "border-border hover:bg-muted",
                            showCorrect && "border-primary bg-primary/10",
                            showWrong && "border-destructive bg-destructive/10",
                          )}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>

            {!submitted && (
              <div className="mt-8 flex justify-end">
                <Button size="lg" onClick={submit} disabled={!allAnswered}>
                  Submit quiz
                </Button>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link to="/courses/$courseId" params={{ courseId: courseId! }} className="text-sm text-muted-foreground hover:text-primary">
                ← Back to course
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}