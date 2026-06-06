import { Link, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Circle, FileQuestion, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Chapter = { id: string; title: string; order_idx: number };
type Quiz = { id: string; title: string };
type ModuleNode = {
  id: string;
  day_number: number;
  order_idx: number;
  title: string;
  chapters: Chapter[];
  quizzes: Quiz[];
};

export function CourseSidebar({
  courseId,
  modules,
  completedChapters,
  passedQuizzes,
}: {
  courseId: string;
  modules: ModuleNode[];
  completedChapters: Set<string>;
  passedQuizzes: Set<string>;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-full shrink-0 border-r border-border bg-card md:w-80">
      <div className="border-b border-border p-5">
        <Link to="/courses/$courseId" params={{ courseId }} className="text-sm font-semibold hover:text-primary">
          ← Course overview
        </Link>
      </div>
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-3">
        {modules.map((mod) => (
          <div key={mod.id} className="mb-4">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {mod.day_number === 0 ? "Orientation" : `Day ${mod.day_number}`} · {mod.title.replace(/^(Orientation Day|Day \d+) — /, "")}
            </div>
            <ul className="space-y-0.5">
              {mod.chapters.map((ch) => {
                const href = `/learn/${ch.id}`;
                const done = completedChapters.has(ch.id);
                const active = pathname === href;
                return (
                  <li key={ch.id}>
                    <Link
                      to="/learn/$chapterId"
                      params={{ chapterId: ch.id }}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        active ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <PlayCircle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="line-clamp-2">{ch.title}</span>
                    </Link>
                  </li>
                );
              })}
              {mod.quizzes.map((q) => {
                const href = `/quiz/${q.id}`;
                const passed = passedQuizzes.has(q.id);
                const active = pathname === href;
                return (
                  <li key={q.id}>
                    <Link
                      to="/quiz/$quizId"
                      params={{ quizId: q.id }}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        active ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                      )}
                    >
                      {passed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <FileQuestion className="h-4 w-4 shrink-0 text-accent" />}
                      <span className="font-medium">{q.title}</span>
                    </Link>
                  </li>
                );
              })}
              {!mod.chapters.length && !mod.quizzes.length && (
                <li className="px-3 py-2 text-xs italic text-muted-foreground">No content yet.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}