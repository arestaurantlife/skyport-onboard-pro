import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  status: z.enum(["success", "error"]).optional(),
  reason: z.string().optional(),
});

export const Route = createFileRoute("/password-reset-status")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Password reset status — Skyportco Training" },
      {
        name: "description",
        content:
          "Confirmation that your Skyportco training account password was updated, with next steps to sign back in.",
      },
      { property: "og:title", content: "Password reset status — Skyportco Training" },
      {
        property: "og:description",
        content:
          "Confirmation that your Skyportco training account password was updated, with next steps to sign back in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PasswordResetStatus,
});

function PasswordResetStatus() {
  const { status, reason } = Route.useSearch();
  const ok = status === "success";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <div
          className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full ${
            ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          }`}
          aria-hidden="true"
        >
          <span className="text-2xl font-semibold">{ok ? "✓" : "!"}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {ok ? "Password updated" : "Password reset didn't complete"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {ok
            ? "Your new password is active. Sign in with your email address and the password you just chose."
            : reason ||
              "The reset link may have expired or already been used. Request a new reset link from the sign-in page and try again."}
        </p>

        <div className="mt-8 space-y-3">
          <Button asChild className="w-full">
            <Link to="/auth" search={{ mode: "signin" }}>
              Go to sign in
            </Link>
          </Button>
          {!ok && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/reset-password">Try setting a password again</Link>
            </Button>
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Still stuck? Managers and admins who signed up with Google should use the{" "}
          <strong>Sign in with Google</strong> button instead of a password.
        </p>
      </main>
    </div>
  );
}