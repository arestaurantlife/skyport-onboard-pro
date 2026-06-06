import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Skyportco / First Meridian Services" },
      { name: "description", content: "Skyportco operates restaurants and fast-food outlets at Denver International Airport under the First Meridian Services name." },
      { property: "og:title", content: "About Skyportco" },
      { property: "og:description", content: "Restaurants and fast-food outlets at Denver International Airport." },
    ],
  }),
  component: About,
});

function About() {
  const leadership = [
    { name: "Patricia Hawthorne", role: "Director of Operations" },
    { name: "Marcus Whitfield", role: "Director of Beverage" },
    { name: "Sandra Liu", role: "HR Director" },
    { name: "Owen Reyes", role: "Training & Compliance" },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">About Skyportco</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Skyportco — operating as <strong className="text-foreground">First Meridian Services</strong> — manages restaurants and fast-food outlets across Denver International Airport.
          From 4 AM coffee to a pre-flight cocktail, we serve every traveler who walks through DEN.
        </p>
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">Our mission</h2>
          <p className="mt-3 text-muted-foreground">
            Deliver memorable hospitality to every traveler. We invest in our people first — that's why every new hire gets the same structured, role-specific 5-day onboarding.
          </p>
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">Leadership</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {leadership.map((l) => (
              <div key={l.name} className="rounded-lg border border-border bg-card p-5">
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm text-muted-foreground">{l.role}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">How the training works</h2>
          <ol className="mt-4 space-y-3 text-muted-foreground">
            <li><strong className="text-foreground">Orientation Day</strong> — Brand, leadership, HR, badge, 7Shifts setup, meet your GM.</li>
            <li><strong className="text-foreground">Day 1</strong> — Floor basics, menu intro, soft drinks, opening/closing procedures.</li>
            <li><strong className="text-foreground">Day 2</strong> — POS, service flow, ServSafe-style food safety + quiz.</li>
            <li><strong className="text-foreground">Day 3</strong> — Alcohol safety (TIPS) + quiz.</li>
            <li><strong className="text-foreground">Day 4</strong> — Execute under supervision, service vs. hospitality.</li>
            <li><strong className="text-foreground">Day 5</strong> — Independent service, manager-as-guest, final exam, certificate.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}