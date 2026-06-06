import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { getCurrentProfile } from "@/lib/training-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manager/admin")({
  component: AdminRoles,
});

type AppRole = "employee" | "manager" | "admin";

function AdminRoles() {
  const qc = useQueryClient();
  const { data: me, refetch: refetchMe } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      return data ?? [];
    },
    enabled: !!me?.roles.includes("admin"),
  });

  const { data: roleRows } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return data ?? [];
    },
    enabled: !!me?.roles.includes("admin"),
  });

  if (!me) return null;

  const isAdmin = me.roles.includes("admin");

  const claimAdmin = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("claim_first_admin");
    if (error) { toast.error(error.message); return; }
    if (data === true) {
      toast.success("You are now admin");
      await refetchMe();
      qc.invalidateQueries();
    } else {
      toast.error("An admin already exists. Ask them to grant you the role.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold">Admin access only</h1>
          <p className="mt-2 text-muted-foreground">
            This page lets admins grant manager or admin roles to other users.
          </p>
          <div className="mt-6 space-y-3">
            <Button onClick={claimAdmin} className="w-full">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Claim admin (first user only)
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            The Claim button only works if no admin exists yet. After that, only existing admins can promote others.
          </p>
        </div>
      </div>
    );
  }

  const rolesByUser = new Map<string, Set<AppRole>>();
  for (const r of roleRows ?? []) {
    const set = rolesByUser.get(r.user_id) ?? new Set<AppRole>();
    set.add(r.role as AppRole);
    rolesByUser.set(r.user_id, set);
  }

  const toggle = async (userId: string, role: AppRole, grant: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("set_user_role", {
      _user_id: userId, _role: role, _grant: grant,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${grant ? "Granted" : "Revoked"} ${role}`);
    qc.invalidateQueries({ queryKey: ["admin-roles"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role administration</h1>
            <p className="mt-1 text-muted-foreground">Grant or revoke manager and admin roles. Every user keeps the employee role by default.</p>
          </div>
          <Button asChild variant="outline"><Link to="/manager">Manager dashboard</Link></Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Current roles</th>
                <th className="px-4 py-3 text-center">Manager</th>
                <th className="px-4 py-3 text-center">Admin</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => {
                const set = rolesByUser.get(p.id) ?? new Set<AppRole>();
                const isMgr = set.has("manager");
                const isAdm = set.has("admin");
                const isSelf = p.id === me.user.id;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {[...set].map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
                        {set.size === 0 && <span className="text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={isMgr} onCheckedChange={(v) => toggle(p.id, "manager", v)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={isAdm}
                        disabled={isSelf && isAdm}
                        onCheckedChange={(v) => toggle(p.id, "admin", v)}
                      />
                      {isSelf && isAdm && <div className="mt-1 text-[10px] text-muted-foreground">you</div>}
                    </td>
                  </tr>
                );
              })}
              {(profiles ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}