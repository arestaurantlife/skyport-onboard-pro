import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

export function SiteHeader() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setHasSession(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Plane className="h-4 w-4" />
          </div>
          <span>Skyportco <span className="font-normal text-muted-foreground">Training</span></span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="hover:text-foreground">Home</Link>
          <Link to="/about" activeProps={{ className: "text-foreground" }} className="hover:text-foreground">About</Link>
          {hasSession && (
            <Link to="/dashboard" activeProps={{ className: "text-foreground" }} className="hover:text-foreground">Dashboard</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {hasSession ? (
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}