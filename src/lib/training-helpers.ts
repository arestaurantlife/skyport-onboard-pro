import { supabase } from "@/integrations/supabase/client";

export type JobRole =
  | "line_cook" | "hostess" | "server" | "bartender" | "food_runner"
  | "dishwasher" | "prep_cook" | "supervisor" | "new_manager";

export const JOB_ROLE_LABELS: Record<JobRole, string> = {
  line_cook: "Line Cook",
  hostess: "Hostess",
  server: "Server",
  bartender: "Bartender",
  food_runner: "Food Runner",
  dishwasher: "Dishwasher",
  prep_cook: "Prep Cook",
  supervisor: "Supervisor",
  new_manager: "New Manager",
};

export async function getCurrentProfile() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, outlet_id, job_role, hired_at")
    .eq("id", u.user.id)
    .maybeSingle();
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", u.user.id);
  return {
    user: u.user,
    profile,
    roles: (roles ?? []).map((r) => r.role as "employee" | "manager" | "admin"),
  };
}

export function newInviteCode(role: JobRole) {
  const prefix = role.split("_").map((s) => s[0]).join("").toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}