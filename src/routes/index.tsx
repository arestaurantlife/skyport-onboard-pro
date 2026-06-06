import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { ShieldCheck, GraduationCap, BarChart3, Award, Plane, ChefHat, Wine, Coffee } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skyportco Training — Onboard every DEN team member in 5 days" },
      { name: "description", content: "The structured 5-day onboarding platform built for Skyportco / First Meridian Services restaurants at Denver International Airport." },
      { property: "og:title", content: "Skyportco Training Platform" },
      { property: "og:description", content: "5-day structured training for every role at every DEN outlet — brand, menu, food safety, alcohol service, and hospitality." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 -z-10 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="mx-auto max-w-7xl px-6 py-24 text-primary-foreground md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Plane className="h-3 w-3" /> Denver International Airport
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Onboard every new hire in 5 structured days.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 md:text-xl">
            Skyportco's official training platform for First Meridian Services restaurants and fast-food outlets at DEN. Brand, menu, food safety, alcohol service, and hospitality — built for every role.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ mode: "signup" }}>Start training</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/0 text-white hover:bg-white/10 hover:text-white">
              <Link to="/about">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: GraduationCap, title: "5-day structured path", body: "Orientation + Day 1–5. Every day delivers 6–8 hours of training tailored to the role you were hired for." },
            { icon: ShieldCheck, title: "Food & alcohol safety", body: "ServSafe-style food handling and TIPS-style alcohol service training with quizzes that must be passed." },
            { icon: BarChart3, title: "Manager visibility", body: "Live progress, quiz scores, and weak-area flags so GMs know exactly where each new hire needs help." },
            { icon: Award, title: "Printable certificate", body: "Pass the final exam and your certificate of completion is generated, ready to print and post." },
            { icon: ChefHat, title: "Role-specific content", body: "Server, bartender, line cook, host, runner, dishwasher, prep cook, supervisor, new manager." },
            { icon: Wine, title: "Brand & menu mastery", body: "Each outlet's menu, hours, leadership, and brand voice — taught the same way every time." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outlets */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Trusted across DEN concourses</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">From early-morning coffee to late-night cocktails, Skyportco operates the brands you find at every DEN gate.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: ChefHat, name: "Mesa Verde Cantina", desc: "Modern Southwestern · Tequila bar · Concourse A" },
              { icon: Coffee, name: "Rocky Brew Coffee", desc: "Specialty coffee · Breakfast · Concourse C" },
              { icon: Wine, name: "Altitude Burger Co.", desc: "Mile-high gourmet burgers · Concourse B" },
            ].map((o) => (
              <div key={o.name} className="rounded-xl border border-border bg-background p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                  <o.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{o.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Have an invite code from your manager?</h2>
        <p className="mt-4 text-lg text-muted-foreground">Sign up in under a minute and start your Orientation Day.</p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth" search={{ mode: "signup" }}>Enter invite code</Link>
        </Button>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © Skyportco / First Meridian Services · Denver International Airport
      </footer>
    </div>
  );
}
