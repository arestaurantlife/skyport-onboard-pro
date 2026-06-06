import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getCurrentProfile, JOB_ROLE_LABELS, type JobRole } from "@/lib/training-helpers";
import { Award, ArrowRight, ShieldAlert, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });

  const { data: course } = useQuery({
    queryKey: ["my-course", me?.profile?.job_role, me?.profile?.outlet_id],
    enabled: !!me?.profile?.job_role && !!me?.profile?.outlet_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, outlet_id, job_role, outlets(name, manager_name)")
        .eq("outlet_id", me!.profile!.outlet_id!)
        .eq("job_role", me!.profile!.job_role!)
        .maybeSingle();
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["my-progress", course?.id],
    enabled: !!course?.id && !!me?.user?.id,
    queryFn: async () => {
      const { data: mods } = await supabase.from("modules").select("id").eq("course_id", course!.id);
      const moduleIds = (mods ?? []).map((m) => m.id);
      const { data: chs } = await supabase.from("chapters").select("id").in("module_id", moduleIds);
      const allChapterIds = (chs ?? []).map((c) => c.id);
      const { data: done } = await supabase
        .from("chapter_progress")
        .select("chapter_id")
        .eq("user_id", me!.user!.id)
        .in("chapter_id", allChapterIds.length ? allChapterIds : ["00000000-0000-0000-0000-000000000000"]);
      return { total: allChapterIds.length, completed: done?.length ?? 0 };
    },
  });

  const { data: cert } = useQuery({
    queryKey: ["my-cert", course?.id],
    enabled: !!course?.id && !!me?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("certificates")
        .select("id")
        .eq("user_id", me!.user!.id)
        .eq("course_id", course!.id)
        .maybeSingle();
      return data;
    },
  });

  if (meLoading) return <Shell><p className="text-muted-foreground">Loading...</p></Shell>;
  if (!me) return null;

  const isManager = me.roles.includes("manager") || me.roles.includes("admin");
  const pct = progress?.total ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {me.profile?.full_name || me.user.email}</h1>
          <p className="mt-1 text-muted-foreground">
            {me.profile?.job_role ? JOB_ROLE_LABELS[me.profile.job_role as JobRole] : "Role not assigned"} ·{" "}
            {course?.outlets?.name ?? "No outlet assigned"}
          </p>
        </div>
        {isManager && (
          <Button asChild variant="outline"><Link to="/manager"><Users className="mr-2 h-4 w-4" />Manager dashboard</Link></Button>
        )}
      </div>

      {!me.profile?.outlet_id || !me.profile?.job_role ? (
        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-6 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">No training assigned yet</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Your account isn't linked to an outlet or role yet. Ask your manager to send you an invite code, then create your account using it.
              </p>
            </div>
          </div>
        </div>
      ) : course ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-2">5-day onboarding</Badge>
              <h2 className="text-2xl font-bold">{course.title}</h2>
              <p className="mt-1 max-w-2xl text-muted-foreground">{course.description}</p>
              {course.outlets?.manager_name && (
                <p className="mt-2 text-sm text-muted-foreground">GM: {course.outlets.manager_name}</p>
              )}
            </div>
            <Button asChild size="lg"><Link to="/courses/$courseId" params={{ courseId: course.id }}>{pct > 0 ? "Continue" : "Start"} training<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm text-muted-foreground">
              <span>Progress</span><span>{progress?.completed ?? 0} / {progress?.total ?? 0} chapters · {pct}%</span>
            </div>
            <Progress value={pct} />
          </div>
          {cert && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <Award className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Certificate of completion issued</p>
                <p className="text-sm text-muted-foreground">You've completed this training program.</p>
              </div>
              <Button asChild variant="outline"><Link to="/certificate/$courseId" params={{ courseId: course.id }}>View certificate</Link></Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">No course exists yet for your outlet + role combination. Sample course is built only for <strong>Server @ Mesa Verde Cantina</strong>.</p>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}