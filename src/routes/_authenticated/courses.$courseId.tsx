import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadCourseTree, loadMyProgress } from "@/lib/course-data";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, FileQuestion, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/courses/$courseId")({
  component: CourseOverview,
});

function CourseOverview() {
  const { courseId } = Route.useParams();
  const { data: tree, isLoading } = useQuery({
    queryKey: ["course-tree", courseId],
    queryFn: () => loadCourseTree(courseId),
  });

  const { data: prog } = useQuery({
    queryKey: ["course-progress", courseId],
    enabled: !!tree,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { completedChapters: new Set<string>(), passedQuizzes: new Set<string>() };
      const chapterIds = (tree?.modules ?? []).flatMap((m) => m.chapters.map((c) => c.id));
      const quizIds = (tree?.modules ?? []).flatMap((m) => m.quizzes.map((q) => q.id));
      return loadMyProgress(u.user.id, chapterIds, quizIds);
    },
  });

  if (isLoading || !tree?.course) {
    return <Shell><p className="text-muted-foreground">Loading course...</p></Shell>;
  }

  const allChapters = tree.modules.flatMap((m) => m.chapters);
  const allQuizzes = tree.modules.flatMap((m) => m.quizzes);
  const totalItems = allChapters.length + allQuizzes.length;
  const done = (prog?.completedChapters.size ?? 0) + (prog?.passedQuizzes.size ?? 0);
  const pct = totalItems ? Math.round((done / totalItems) * 100) : 0;

  const firstUnfinishedChapter = allChapters.find((c) => !prog?.completedChapters.has(c.id));

  return (
    <Shell>
      <div className="rounded-2xl bg-card p-8 shadow-sm" style={{ background: "var(--gradient-hero)" }}>
        <div className="text-primary-foreground">
          <Badge className="bg-white/20 text-white hover:bg-white/30">5-day onboarding</Badge>
          <h1 className="mt-3 text-3xl font-bold">{tree.course.title}</h1>
          <p className="mt-2 max-w-2xl text-white/85">{tree.course.description}</p>
          {tree.course.outlets?.brand_description && (
            <p className="mt-4 max-w-3xl text-sm text-white/75">{tree.course.outlets.brand_description}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {firstUnfinishedChapter && (
              <Button asChild size="lg" variant="secondary">
                <Link to="/learn/$chapterId" params={{ chapterId: firstUnfinishedChapter.id }}>
                  {done > 0 ? "Continue" : "Start"} training
                </Link>
              </Button>
            )}
            <div className="min-w-[240px] flex-1">
              <div className="mb-1 flex justify-between text-xs text-white/85">
                <span>Progress</span><span>{pct}%</span>
              </div>
              <Progress value={pct} className="bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {tree.modules.map((mod) => (
          <div key={mod.id} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {mod.day_number === 0 ? "Orientation Day" : `Day ${mod.day_number}`}
                </p>
                <h2 className="text-xl font-bold">{mod.title.replace(/^(Orientation Day|Day \d+) — /, "")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
              </div>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {mod.chapters.map((ch) => {
                const done = prog?.completedChapters.has(ch.id);
                return (
                  <li key={ch.id}>
                    <Link to="/learn/$chapterId" params={{ chapterId: ch.id }} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                      {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <PlayCircle className="h-5 w-5 text-muted-foreground" />}
                      <span className="flex-1 text-sm font-medium">{ch.title}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{ch.estimated_minutes} min</span>
                    </Link>
                  </li>
                );
              })}
              {mod.quizzes.map((q) => {
                const passed = prog?.passedQuizzes.has(q.id);
                return (
                  <li key={q.id}>
                    <Link to="/quiz/$quizId" params={{ quizId: q.id }} className="flex items-center gap-3 p-4 hover:bg-muted/50">
                      {passed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <FileQuestion className="h-5 w-5 text-accent" />}
                      <span className="flex-1 text-sm font-semibold">{q.title}</span>
                      <Badge variant={passed ? "secondary" : "outline"}>{passed ? "Passed" : "Quiz"}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}