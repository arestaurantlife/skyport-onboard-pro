import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { JOB_ROLE_LABELS, type JobRole, getCurrentProfile } from "@/lib/training-helpers";
import { loadCourseTree } from "@/lib/course-data";

export const Route = createFileRoute("/_authenticated/manager/employees/$id")({
  component: EmployeePage,
});

function EmployeePage() {
  const { id } = Route.useParams();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });
  const isAuthorized = me?.roles.includes("manager") || me?.roles.includes("admin");

  const { data: emp } = useQuery({
    queryKey: ["emp", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_role, outlet_id, hired_at, outlets(name, manager_name)")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: course } = useQuery({
    queryKey: ["emp-course", emp?.outlet_id, emp?.job_role],
    enabled: !!emp?.outlet_id && !!emp?.job_role,
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .eq("outlet_id", emp!.outlet_id!)
        .eq("job_role", emp!.job_role!)
        .maybeSingle();
      return data;
    },
  });

  const { data: tree } = useQuery({
    queryKey: ["course-tree", course?.id],
    enabled: !!course?.id,
    queryFn: () => loadCourseTree(course!.id),
  });

  const { data: attempts } = useQuery({
    queryKey: ["emp-attempts", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, score, passed, taken_at")
        .eq("user_id", id)
        .order("taken_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["emp-progress", id],
    queryFn: async () => {
      const { data } = await supabase.from("chapter_progress").select("chapter_id, completed_at").eq("user_id", id);
      return data ?? [];
    },
  });

  if (!me) return null;
  if (!isAuthorized) return <div className="p-10">Manager access only.</div>;
  if (!emp) return <div className="p-10 text-muted-foreground">Loading...</div>;

  const completedSet = new Set((progress ?? []).map((p) => p.chapter_id));
  const bestAttempt = (quizId: string) => {
    const list = (attempts ?? []).filter((a) => a.quiz_id === quizId);
    if (!list.length) return null;
    return list.reduce((b, a) => (a.score > b.score ? a : b));
  };

  const allChapters = tree?.modules.flatMap((m) => m.chapters) ?? [];
  const allQuizzes = tree?.modules.flatMap((m) => m.quizzes) ?? [];
  const total = allChapters.length + allQuizzes.length;
  const done = completedSet.size + allQuizzes.filter((q) => bestAttempt(q.id)?.passed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/manager"><ArrowLeft className="mr-1 h-4 w-4" />Manager dashboard</Link></Button>

        <div className="rounded-xl border border-border bg-card p-6">
          <h1 className="text-2xl font-bold">{emp.full_name || emp.email}</h1>
          <p className="text-sm text-muted-foreground">{emp.email}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{emp.job_role ? JOB_ROLE_LABELS[emp.job_role as JobRole] : "No role"}</Badge>
            <Badge variant="outline">{emp.outlets?.name ?? "No outlet"}</Badge>
            {emp.outlets?.manager_name && <Badge variant="outline">GM: {emp.outlets.manager_name}</Badge>}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm text-muted-foreground"><span>Overall completion</span><span>{done}/{total} · {pct}%</span></div>
            <Progress value={pct} />
          </div>
        </div>

        {!tree && <p className="mt-6 text-muted-foreground">No course assigned for this role/outlet combination.</p>}

        {tree && (
          <div className="mt-8 space-y-6">
            {tree.modules.map((mod) => (
              <div key={mod.id} className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {mod.day_number === 0 ? "Orientation" : `Day ${mod.day_number}`}
                </p>
                <h2 className="text-lg font-bold">{mod.title.replace(/^(Orientation Day|Day \d+) — /, "")}</h2>
                <ul className="mt-3 divide-y divide-border">
                  {mod.chapters.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                      {completedSet.has(c.id) ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                      <span className="flex-1">{c.title}</span>
                    </li>
                  ))}
                  {mod.quizzes.map((q) => {
                    const best = bestAttempt(q.id);
                    const weak = best && !best.passed;
                    return (
                      <li key={q.id} className="flex items-center gap-3 py-2 text-sm">
                        {best?.passed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : weak ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                        <span className="flex-1 font-medium">{q.title}</span>
                        {best ? (
                          <Badge variant={best.passed ? "secondary" : "destructive"}>{best.score}%</Badge>
                        ) : (
                          <Badge variant="outline">Not attempted</Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}