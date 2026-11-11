import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const JOB_ROLE_LABELS: Record<string, string> = {
  line_cook: "Line Cook", hostess: "Host", server: "Server", bartender: "Bartender",
  food_runner: "Food Runner", dishwasher: "Dishwasher", prep_cook: "Prep Cook",
  supervisor: "Supervisor", new_manager: "New Manager",
};

// Sends the employee-invite email for one invite the caller can see (RLS-scoped).
export const sendInviteEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ inviteId: z.string().uuid(), origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: inv, error } = await context.supabase
      .from("invites")
      .select("id, code, job_role, expires_at, invitee_email, outlets(name)")
      .eq("id", data.inviteId)
      .maybeSingle();
    if (error || !inv) throw new Error("Invite not found");
    if (!inv.invitee_email) throw new Error("No email on file for this invite");
    const { data: me } = await context.supabase.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const recipient = inv.invitee_email;
    const log = async (status: string, error_message?: string) => {
      const { error: logErr } = await supabaseAdmin.from("email_send_log").insert({
        template_name: "employee-invite", recipient_email: recipient, status, error_message: error_message ?? null,
      });
      if (logErr) console.error("email_send_log insert failed", { code: logErr.code, message: logErr.message });
    };
    try {
      const result = await sendTemplateEmail("employee-invite", recipient, {
        idempotencyKey: `invite-${inv.id}-${Date.now()}`,
        templateData: {
          outletName: (inv as any).outlets?.name ?? "your new outlet",
          jobRole: JOB_ROLE_LABELS[inv.job_role] ?? inv.job_role,
          inviteCode: inv.code,
          signupUrl: `${data.origin}/auth?mode=signup&code=${encodeURIComponent(inv.code)}`,
          expiresAt: new Date(inv.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          invitedByName: me?.full_name || undefined,
        },
      });
      await log(result.sent ? "sent" : "suppressed");
      return { sent: result.sent };
    } catch (e: any) {
      await log("failed", e?.message ?? String(e));
      throw e;
    }
  });
