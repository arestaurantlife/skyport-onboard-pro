import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Users, AlertTriangle } from "lucide-react";
import { getCurrentProfile, JOB_ROLE_LABELS, newInviteCode, type JobRole } from "@/lib/training-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manager/")({
  component: ManagerHome,
});

const JOB_ROLES: JobRole[] = ["line_cook","hostess","server","bartender","food_runner","dishwasher","prep_cook","supervisor","new_manager"];

function ManagerHome() {
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });

  const { data: outlets } = useQuery({
    queryKey: ["outlets"],
    queryFn: async () => {
      const { data } = await supabase.from("outlets").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_role, outlet_id, hired_at, outlets(name)")
        .order("hired_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: allAttempts } = useQuery({
    queryKey: ["all-attempts"],
    queryFn: async () => {
      const { data } = await supabase.from("quiz_attempts").select("user_id, quiz_id, score, passed, taken_at");
      return data ?? [];
    },
  });

  const { data: allProgress } = useQuery({
    queryKey: ["all-progress"],
    queryFn: async () => {
      const { data } = await supabase.from("chapter_progress").select("user_id, chapter_id");
      return data ?? [];
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["invites"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invites")
        .select("id, code, job_role, outlet_id, used_by, expires_at, created_at, outlets(name)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const isAuthorized = me?.roles.includes("manager") || me?.roles.includes("admin");

  // form state
  const [formOutlet, setFormOutlet] = useState<string>("");
  const [formRole, setFormRole] = useState<JobRole>("server");
  const [creating, setCreating] = useState(false);

  if (!me) return null;
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold">Manager access only</h1>
          <p className="mt-2 text-muted-foreground">Your account doesn't have manager permissions.</p>
          <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </div>
    );
  }

  const createInvite = async () => {
    if (!formOutlet) { toast.error("Pick an outlet"); return; }
    setCreating(true);
    const code = newInviteCode(formRole);
    const { error } = await supabase.from("invites").insert({
      code,
      outlet_id: formOutlet,
      job_role: formRole,
      created_by: me.user.id,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Invite created: ${code}`);
    qc.invalidateQueries({ queryKey: ["invites"] });
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/auth?mode=signup`;
    navigator.clipboard.writeText(`Join Skyportco training: ${url}\nInvite code: ${code}`);
    toast.success("Invite copied to clipboard");
  };

  const summaryFor = (userId: string) => {
    const completed = allProgress?.filter((p) => p.user_id === userId).length ?? 0;
    const attempts = allAttempts?.filter((a) => a.user_id === userId) ?? [];
    const passed = attempts.filter((a) => a.passed).length;
    const failed = attempts.filter((a) => !a.passed).length;
    const weakAreas = attempts.filter((a) => a.score < 80).length;
    return { completed, passed, failed, weakAreas, attempts: attempts.length };
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track new-hire onboarding progress and invite new employees.</p>
          </div>
          <Button asChild variant="outline"><Link to="/dashboard">My training</Link></Button>
        </div>

        {/* Invite creator */}
        <section className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Plus className="h-5 w-5" />Generate invite code</h2>
          <p className="mt-1 text-sm text-muted-foreground">One code → one new hire. Tied to outlet + role.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label>Outlet</Label>
              <Select value={formOutlet} onValueChange={setFormOutlet}>
                <SelectTrigger><SelectValue placeholder="Choose outlet" /></SelectTrigger>
                <SelectContent>{outlets?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Job role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as JobRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_ROLES.map((r) => <SelectItem key={r} value={r}>{JOB_ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button onClick={createInvite} disabled={creating} className="w-full">Create invite</Button></div>
          </div>

          {invites && invites.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">Recent invites</h3>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                    <code className="rounded bg-muted px-2 py-1 font-mono font-bold">{inv.code}</code>
                    <span className="text-muted-foreground">{JOB_ROLE_LABELS[inv.job_role as JobRole]} · {inv.outlets?.name}</span>
                    {inv.used_by ? <Badge variant="secondary">Used</Badge> : <Badge>Unused</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => copyLink(inv.code)}><Copy className="mr-1 h-3 w-3" />Copy</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Employees */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Users className="h-5 w-5" />Employees in training</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Outlet</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Chapters</th>
                  <th className="px-4 py-3">Quizzes</th>
                  <th className="px-4 py-3">Weak areas</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(employees ?? []).filter((e) => e.job_role).map((e) => {
                  const s = summaryFor(e.id);
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{e.full_name || e.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.outlets?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.job_role ? JOB_ROLE_LABELS[e.job_role as JobRole] : "—"}</td>
                      <td className="px-4 py-3">{s.completed}</td>
                      <td className="px-4 py-3">{s.passed}/{s.attempts}</td>
                      <td className="px-4 py-3">{s.weakAreas > 0 ? <Badge variant="destructive">{s.weakAreas}</Badge> : <Badge variant="secondary">0</Badge>}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="outline"><Link to="/manager/employees/$id" params={{ id: e.id }}>View</Link></Button>
                      </td>
                    </tr>
                  );
                })}
                {(employees ?? []).filter((e) => e.job_role).length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No employees in training yet. Generate an invite above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// progress not used here yet, but Progress import kept for future use
void Progress;
void Input;