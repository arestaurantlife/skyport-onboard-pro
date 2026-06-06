import { supabase } from "@/integrations/supabase/client";

export interface SendTransactionalEmailInput {
  templateName: string;
  recipientEmail: string;
  idempotencyKey: string;
  templateData?: Record<string, unknown>;
}

export async function sendTransactionalEmail(input: SendTransactionalEmailInput) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("not_authenticated");

  const res = await fetch("/lovable/email/transactional/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`email_send_failed_${res.status}: ${text}`);
  }
  return res.json().catch(() => ({}));
}