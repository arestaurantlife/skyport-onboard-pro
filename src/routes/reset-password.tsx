import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  clearPasswordResetSessionMarker,
  completePasswordResetLink,
  hasPasswordResetLinkParams,
  hasPasswordResetSessionMarker,
} from "@/lib/auth/password-reset";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Skyportco Training" },
      { name: "description", content: "Set a new password for your Skyportco employee training account." },
      { property: "og:title", content: "Reset password — Skyportco Training" },
      { property: "og:description", content: "Set a new password for your Skyportco employee training account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareResetSession() {
      if (hasPasswordResetLinkParams()) {
        const result = await completePasswordResetLink();
        if (!result.ok) {
          navigate({
            to: "/password-reset-status",
            search: {
              status: "error",
              reason: result.reason ?? "The reset link could not be verified. Request a new reset email and try again.",
            },
            replace: true,
          });
          return;
        }
        window.history.replaceState(null, "", "/reset-password");
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!hasPasswordResetSessionMarker() || !data.session) {
        navigate({
          to: "/password-reset-status",
          search: {
            status: "error",
            reason: "Open the reset link from your email before choosing a new password. If the link is old, request a fresh reset email from the sign-in page.",
          },
          replace: true,
        });
        return;
      }

      setReady(true);
    }

    prepareResetSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setLoading(false);
      navigate({
        to: "/password-reset-status",
        search: {
          status: "error",
          reason: "Your reset session expired before the password was updated. Request a new reset email and use the newest link.",
        },
        replace: true,
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      navigate({
        to: "/password-reset-status",
        search: { status: "error", reason: error.message },
        replace: true,
      });
      return;
    }
    clearPasswordResetSessionMarker();
    await supabase.auth.signOut();
    toast.success("Password updated.");
    navigate({ to: "/password-reset-status", search: { status: "success" }, replace: true });
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight">Checking reset link</h1>
          <p className="mt-2 text-muted-foreground">Verifying your password reset session...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a new password for your Skyportco Training account. After it updates, sign in again with the new password.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="newpass">New password</Label>
            <Input
              id="newpass"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmpass">Confirm new password</Label>
            <Input
              id="confirmpass"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </main>
    </div>
  );
}