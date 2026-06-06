import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadCourseTree, loadMyProgress } from "@/lib/course-data";
import { SiteHeader } from "@/components/SiteHeader";
import { CourseSidebar } from "@/components/CourseSidebar";
import { Markdown } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/learn/$chapterId")({
  component: ChapterPage,
});

function ChapterPage() {
  const { chapterId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: chapter } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chapters")
        .select("*, modules(id, title, day_number, course_id, courses(id, title))")
        .eq("id", chapterId)
        .maybeSingle();
      return data;
    },
  });

  const courseId = chapter?.modules?.course_id;

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

  if (!chapter || !tree) return <div className="p-10 text-muted-foreground">Loading...</div>;

  // Flatten sequence: chapters + quizzes in module order
  const sequence: Array<{ kind: "chapter" | "quiz"; id: string; title: string }> = [];
  for (const m of tree.modules) {
    for (const c of m.chapters) sequence.push({ kind: "chapter", id: c.id, title: c.title });
    for (const q of m.quizzes) sequence.push({ kind: "quiz", id: q.id, title: q.title });
  }
  const idx = sequence.findIndex((s) => s.kind === "chapter" && s.id === chapterId);
  const prev = idx > 0 ? sequence[idx - 1] : null;
  const next = idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : null;

  const done = prog?.completedChapters.has(chapterId);

  const markComplete = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (!done) {
      const { error } = await supabase.from("chapter_progress").insert({ user_id: u.user.id, chapter_id: chapterId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Chapter marked complete");
      await qc.invalidateQueries({ queryKey: ["course-progress", courseId] });
    }
    if (next) {
      if (next.kind === "chapter") navigate({ to: "/learn/$chapterId", params: { chapterId: next.id } });
      else navigate({ to: "/quiz/$quizId", params: { quizId: next.id } });
    } else {
      navigate({ to: "/courses/$courseId", params: { courseId: courseId! } });
    }
  };

  const videoEmbed = chapter.video_url;

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
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {chapter.modules?.day_number === 0 ? "Orientation" : `Day ${chapter.modules?.day_number}`}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{chapter.title}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {chapter.estimated_minutes} minutes
            </p>

            {videoEmbed && (
              <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                <iframe
                  src={videoEmbed}
                  title={chapter.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="prose prose-slate mt-8 max-w-none">
              <Markdown source={chapter.body_markdown || ""} />
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              {prev ? (
                <Button asChild variant="outline">
                  {prev.kind === "chapter" ? (
                    <Link to="/learn/$chapterId" params={{ chapterId: prev.id }}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Link>
                  ) : (
                    <Link to="/quiz/$quizId" params={{ quizId: prev.id }}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Link>
                  )}
                </Button>
              ) : (
                <Button asChild variant="outline"><Link to="/courses/$courseId" params={{ courseId: courseId! }}><ChevronLeft className="mr-1 h-4 w-4" />Overview</Link></Button>
              )}
              <Button onClick={markComplete}>
                {done ? "Next" : "Mark complete & continue"}
                {done ? <ChevronRight className="ml-1 h-4 w-4" /> : <CheckCircle2 className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}