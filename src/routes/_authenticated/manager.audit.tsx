import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { getCurrentProfile } from "@/lib/training-helpers";

export const Route = createFileRoute("/_authenticated/manager/audit")({
  component: AuditPage,
});

type AuditRow = {
  id: string;
  user_id: string;
  course_id: string;
  certificate_id: string | null;
  outcome: string;
  reason: string | null;
  quizzes_required: number | null;
  quizzes_passed: number | null;
  created_at: string;
};

const OUTCOME_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  issued: "default",
  already_existed: "secondary",
  course_not_complete: "destructive",
  course_has_no_quizzes: "outline",
};

function AuditPage() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const { data: rows } = useQuery({
    queryKey: ["cert-audit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("certificate_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return (data ?? []) as AuditRow[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["audit-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data ?? [];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["audit-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title");
      return data ?? [];
    },
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, { name: string; email: string }>();
    (profiles ?? []).forEach((p) => m.set(p.id, { name: p.full_name || "", email: p.email || "" }));
    return m;
  }, [profiles]);

  const courseMap = useMemo(() => {
    const m = new Map<string, string>();
    (courses ?? []).forEach((c) => m.set(c.id, c.title));
    return m;
  }, [courses]);

  const filtered = useMemo(() => {
    const e = employeeFilter.trim().toLowerCase();
    const c = courseFilter.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (e) {
        const p = profileMap.get(r.user_id);
        const hay = `${p?.name ?? ""} ${p?.email ?? ""}`.toLowerCase();
        if (!hay.includes(e)) return false;
      }
      if (c) {
        const title = (courseMap.get(r.course_id) ?? "").toLowerCase();
        if (!title.includes(c)) return false;
      }
      return true;
    });
  }, [rows, employeeFilter, courseFilter, profileMap, courseMap]);

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Certificate audit log
            </h1>
            <p className="mt-1 text-muted-foreground">Every certificate issuance attempt — issued, duplicate, or rejected.</p>
          </div>
          <Button asChild variant="outline"><Link to="/manager">Back to dashboard</Link></Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Input placeholder="Filter by employee name or email" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} />
          <Input placeholder="Filter by course title" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Quizzes</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const p = profileMap.get(r.user_id);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{p?.name || p?.email || r.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{courseMap.get(r.course_id) ?? r.course_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={OUTCOME_VARIANT[r.outcome] ?? "outline"}>{r.outcome.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.quizzes_passed ?? 0}/{r.quizzes_required ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.reason ?? "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No audit entries match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}