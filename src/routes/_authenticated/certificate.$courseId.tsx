import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, JOB_ROLE_LABELS, type JobRole } from "@/lib/training-helpers";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Plane, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/certificate/$courseId")({
  component: CertificatePage,
});

function CertificatePage() {
  const { courseId } = Route.useParams();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });
  const { data: cert } = useQuery({
    queryKey: ["cert", courseId, me?.user?.id],
    enabled: !!me?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("certificates")
        .select("id, serial, issued_at, courses(title, outlets(name))")
        .eq("course_id", courseId)
        .eq("user_id", me!.user.id)
        .maybeSingle();
      return data;
    },
  });

  if (!me) return null;
  if (!cert) {
    return (
      <div className="min-h-screen bg-background p-10 text-center">
        <p className="text-muted-foreground">No certificate yet. Pass every quiz to unlock it.</p>
        <Button asChild className="mt-4" variant="outline"><Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40 print:bg-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Button asChild variant="outline"><Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Dashboard</Link></Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
        </div>
        <div className="relative aspect-[1.414/1] overflow-hidden rounded-xl border-[6px] border-primary bg-white p-12 shadow-2xl print:rounded-none print:border-primary print:shadow-none">
          <div className="absolute inset-4 rounded-md border-2 border-accent/40" />
          <div className="relative flex h-full flex-col items-center justify-between text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plane className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.3em] text-primary">Skyportco · First Meridian Services</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Denver International Airport</p>
            </div>
            <div className="my-6">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                {me.profile?.full_name || me.user.email}
              </h1>
              <p className="mt-4 text-base text-muted-foreground">has successfully completed the 5-day onboarding program</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{cert.courses?.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {me.profile?.job_role && JOB_ROLE_LABELS[me.profile.job_role as JobRole]} · {cert.courses?.outlets?.name}
              </p>
            </div>
            <div className="flex w-full items-end justify-between gap-8 text-xs text-muted-foreground">
              <div className="flex-1 border-t border-foreground/30 pt-2 text-left">
                <p className="font-semibold text-foreground">Issued</p>
                <p>{new Date(cert.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <Award className="h-12 w-12 text-accent" />
              <div className="flex-1 border-t border-foreground/30 pt-2 text-right">
                <p className="font-semibold text-foreground">Serial</p>
                <p className="font-mono">{cert.serial}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}