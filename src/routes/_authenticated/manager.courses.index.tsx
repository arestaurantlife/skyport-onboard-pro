import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BookOpen, Download, Plus, Trash2, Upload } from "lucide-react";
import { getCurrentProfile, JOB_ROLE_LABELS, type JobRole } from "@/lib/training-helpers";
import {
  COURSE_IMPORT_TEMPLATE,
  deleteCourse,
  exportCourse,
  importCourse,
  validateCourseImport,
} from "@/lib/course-authoring";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manager/courses/")({
  head: () => ({
    meta: [
      { title: "Training Course Builder — Skyportco" },
      {
        name: "description",
        content:
          "Create and upload role-specific onboarding courses, modules, chapters, and quizzes for Skyportco outlet teams.",
      },
      { property: "og:title", content: "Training Course Builder — Skyportco" },
      {
        property: "og:description",
        content: "Build role-specific onboarding courses with modules, chapters, and quizzes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourseBuilder,
});

const JOB_ROLES: JobRole[] = [
  "server", "hostess", "bartender", "line_cook", "prep_cook",
  "food_runner", "dishwasher", "supervisor", "new_manager",
];

function CourseBuilder() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getCurrentProfile });

  const { data: outlets } = useQuery({
    queryKey: ["outlets"],
    queryFn: async () => {
      const { data } = await supabase.from("outlets").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["author-courses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, job_role, outlet_id, created_at, outlets(name), modules(id)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobRole, setJobRole] = useState<JobRole>("server");
  const [outletId, setOutletId] = useState<string>("all");
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");

  const isAuthorized = me?.roles.includes("manager") || me?.roles.includes("admin");
  if (!me) return null;
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-2xl font-bold">Manager access only</h1>
          <p className="mt-2 text-muted-foreground">Only managers and administrators can build training courses.</p>
          <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
      </div>
    );
  }

  const createBlank = async () => {
    if (!title.trim()) { toast.error("Give the course a title"); return; }
    setBusy(true);
    try {
      const id = await importCourse({
        title,
        description,
        job_role: jobRole,
        outlet_id: outletId === "all" ? null : outletId,
        modules: [],
      });
      toast.success("Course created — add modules next");
      setTitle(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["author-courses"] });
      void id;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the course");
    } finally {
      setBusy(false);
    }
  };

  const uploadJson = async (text: string) => {
    setBusy(true);
    try {
      const parsed = validateCourseImport(JSON.parse(text));
      await importCourse(parsed);
      toast.success(`Uploaded “${parsed.title}”`);
      setJson("");
      qc.invalidateQueries({ queryKey: ["author-courses"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid course file");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    await uploadJson(await file.text());
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadJson = (data: unknown, name: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeCourse = async (id: string, name: string) => {
    if (!window.confirm(`Delete “${name}” and all of its modules, chapters and quizzes?`)) return;
    try {
      await deleteCourse(id);
      toast.success("Course deleted");
      qc.invalidateQueries({ queryKey: ["author-courses"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the course");
    }
  };

  const visible = (courses ?? []).filter((c) => filterRole === "all" || c.job_role === filterRole);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training course builder</h1>
            <p className="mt-1 text-muted-foreground">
              Create onboarding courses per job role, then add modules, chapters and quizzes.
            </p>
          </div>
          <Button asChild variant="outline"><Link to="/manager">Manager dashboard</Link></Button>
        </div>

        {/* Create */}
        <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Plus className="h-5 w-5" />New course</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Course title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Server Onboarding — Mesa Verde Cantina" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What this course covers." />
            </div>
            <div>
              <Label>Job role</Label>
              <Select value={jobRole} onValueChange={(v) => setJobRole(v as JobRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_ROLES.map((r) => <SelectItem key={r} value={r}>{JOB_ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Outlet</Label>
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All outlets</SelectItem>
                  {outlets?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-4 w-full sm:w-auto" onClick={createBlank} disabled={busy}>Create course</Button>
        </section>

        {/* Upload */}
        <section className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Upload className="h-5 w-5" />Upload a full course</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a JSON file containing the whole course — modules, chapters and quiz questions in one go.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload className="mr-2 h-4 w-4" />Choose JSON file
            </Button>
            <Button variant="ghost" onClick={() => downloadJson(COURSE_IMPORT_TEMPLATE, "skyportco-course-template.json")}>
              <Download className="mr-2 h-4 w-4" />Download template
            </Button>
          </div>
          <div className="mt-4">
            <Label>…or paste the course JSON</Label>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={6}
              className="font-mono text-xs" placeholder='{ "title": "...", "job_role": "server", "modules": [] }' />
            <Button className="mt-3 w-full sm:w-auto" disabled={busy || !json.trim()} onClick={() => uploadJson(json)}>
              Upload course
            </Button>
          </div>
        </section>

        {/* Existing */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold"><BookOpen className="h-5 w-5" />Courses by role</h2>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All job roles</SelectItem>
                {JOB_ROLES.map((r) => <SelectItem key={r} value={r}>{JOB_ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 space-y-3">
            {visible.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{c.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {c.job_role ? JOB_ROLE_LABELS[c.job_role as JobRole] : "All roles"}
                      </Badge>
                      <span>{c.outlets?.name ?? "All outlets"}</span>
                      <span>· {c.modules?.length ?? 0} modules</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to="/manager/courses/$courseId" params={{ courseId: c.id }}>Edit content</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      try {
                        downloadJson(await exportCourse(c.id), `${c.title.replace(/\W+/g, "-").toLowerCase()}.json`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Export failed");
                      }
                    }}>
                      <Download className="mr-1 h-3 w-3" />Export
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeCourse(c.id, c.title)}>
                      <Trash2 className="mr-1 h-3 w-3" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No courses for this role yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}