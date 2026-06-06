import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — Skyportco Training" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-2 text-muted-foreground">Sign in or create your training account.</p>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")} className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <SignInForm onDone={() => navigate({ to: "/dashboard", replace: true })} />
          </TabsContent>
          <TabsContent value="signup">
            <SignUpForm onDone={() => navigate({ to: "/dashboard", replace: true })} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else onDone();
  };
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const code = inviteCode.trim().toUpperCase();
      if (!code) {
        toast.error("Invite code is required.");
        setLoading(false);
        return;
      }
      // Validate without exposing the invites table.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: validateRows, error: validateErr } = await (supabase as any).rpc("validate_invite", { _code: code });
      if (validateErr || !validateRows || validateRows.length === 0) {
        toast.error("Invalid, expired, or already-used invite code.");
        setLoading(false);
        return;
      }

      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName },
        },
      });
      if (signErr) {
        toast.error(signErr.message);
        setLoading(false);
        return;
      }
      const userId = signUp.user?.id;
      if (!userId) {
        toast.error("Sign up succeeded but no user returned. Check your email to confirm.");
        setLoading(false);
        return;
      }

      await supabase.from("profiles").update({ full_name: fullName }).eq("id", userId);
      // Atomically claim the invite (server-side: marks invite used + sets outlet/job_role).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: claimErr } = await (supabase as any).rpc("claim_invite", { _code: code });
      if (claimErr) {
        toast.error(`Account created but invite claim failed: ${claimErr.message}`);
        setLoading(false);
        return;
      }

      toast.success("Welcome aboard!");
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email2">Email</Label>
        <Input id="email2" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password2">Password</Label>
        <Input id="password2" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="invite">Invite code (from your manager)</Label>
        <Input id="invite" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="e.g. SERVER-MVC-7Q3X" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
      <p className="text-center text-xs text-muted-foreground">By signing up you agree to follow Skyportco / First Meridian Services policies.</p>
      <p className="text-center text-sm">
        Have an account? <Link to="/auth" search={{ mode: "signin" }} className="text-primary underline">Sign in</Link>
      </p>
    </form>
  );
}