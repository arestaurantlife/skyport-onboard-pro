import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { completePasswordResetLink } from "@/lib/auth/password-reset";

const searchSchema = z.object({
  code: z.string().optional(),
  token_hash: z.string().optional(),
  type: z.string().optional(),
  next: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Verifying reset link — Skyportco Training" },
      { name: "description", content: "Securely verify your Skyportco password reset link before choosing a new password." },
      { property: "og:title", content: "Verifying reset link — Skyportco Training" },
      { property: "og:description", content: "Secure password reset verification for Skyportco Training accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your reset link...");

  useEffect(() => {
    let cancelled = false;

    async function verifyLink() {
      const result = await completePasswordResetLink();
      if (cancelled) return;

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

      setMessage("Reset link verified. Opening the password form...");
      navigate({ to: "/reset-password", replace: true });
    }

    verifyLink();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Password reset</h1>
        <p className="mt-3 text-muted-foreground">{message}</p>
        <div className="mt-8">
          <Button asChild variant="outline" className="w-full">
            <Link to="/auth" search={{ mode: "signin" }}>
              Back to sign in
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}