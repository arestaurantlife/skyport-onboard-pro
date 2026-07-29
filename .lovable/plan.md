## Scope: Prompt 1 only — Tenancy, people, roles

Database only. No UI. I'll plan and implement one prompt per turn so you can verify acceptance criteria and commit before moving on.

## Decisions I'm making for you

**The existing schema stays untouched.** This project already has a live, different data model (`profiles`, `outlets`, `courses`, `modules`, `chapters`, `quizzes`, `quiz_questions`, `certificates`, `invites`, `chapter_progress`, `quiz_attempts`) with no `org_id`, no curricula, no translation sidecars. The brief's model is incompatible with it. Rather than destroy working data or reshape tables mid-flight, I'll build the new model alongside the old under distinct names, and we retire the legacy tables in a later, deliberate step.

Concretely, the two collisions get new names:
- `organizations` — new, no conflict
- `outlets` already exists (columns: name, concept, brand_description, hours, manager_name, director_name, terminal) with no `org_id`. I'll **add `org_id`** to it and backfill to the Skyportco org rather than create a duplicate table — it already holds your three real outlets.
- `profiles` already exists (id, full_name, email, outlet_id, job_role, hired_at, is_test_account). I'll **extend** it with `org_id`, `primary_outlet_id`, `job_role_key`, `preferred_language`, `hire_date` rather than create a second people table. Existing rows backfill to the Skyportco org.
- `app_role_assignments` and `job_roles` — new tables. The legacy `user_roles` table stays for now so the current admin panel keeps working; `app_role_assignments` becomes the system of record going forward.

**I don't have the build brief.** `skyportco-platform-build-brief.md` isn't in the project — I'll infer columns from your prompt text and standard practice, and flag any column I invented so you can correct it before I apply the migration. Same applies to the section 1 permission matrix (prompt 6) and section 8 notification table (prompt 22) — those prompts will need the brief or your direction when we reach them.

## What the Prompt 1 migration does

**Tables**

| Table | Key columns |
|---|---|
| `organizations` | name, legal_name, slug (unique), logo_url, unit_label default `'module'`, pass_threshold_default default 90, invite_expiry_days default 14 |
| `outlets` (extend) | + org_id not null, concourse |
| `profiles` (extend) | + org_id, primary_outlet_id, job_role_key, preferred_language default `'en'` check in (en, es), hire_date |
| `app_role_assignments` | user_id, org_id, app_role, outlet_scope_id, granted_by, granted_at, revoked_at (null = active) |
| `job_roles` | org_id (null = global), key, is_management, sort_order; unique on (org_id, key) |

`app_role` is an enum: `super_admin`, `org_admin`, `director_of_operations`, `general_manager`, `manager`, `assistant_manager`, `trainee`. (Kept separate from the existing `app_role` enum used by `user_roles`, which only has employee/manager/admin — I'll name the new one `platform_role` to avoid a type collision, unless you want the old enum extended.)

**Security-definer functions** — both `security definer`, `stable`, `set search_path = public`:
- `current_org_ids() returns setof uuid` — union of the caller's `profiles.org_id` and their non-revoked `app_role_assignments.org_id`
- `has_app_role(target_role text, target_org uuid) returns boolean` — true when the caller holds that role in that org with `revoked_at is null`

Plus the `GRANT`s required for the Data API to reach the new tables.

**RLS**: enabled on all five, zero policies (per your instruction). Note this makes the new tables unreadable by the app until prompt 6 — expected, and the existing app is unaffected since it uses the legacy tables.

**Seed**
- One organization: Skyportco / First Meridian Services / `skyportco` / unit_label `module` / 90 / 14
- The three outlets get `org_id` backfilled: Mesa Verde Cantina (Concourse A), Rocky Brew Coffee (Concourse C), Altitude Burger Co. (Concourse B). I'll set `concourse` on the existing rows rather than insert duplicates.
- Eleven global job_roles (`org_id` null): server, hostess, support, bartender, cook, dishwasher, food_runner, manager, assistant_manager, general_manager, director_of_operations — last four `is_management = true`.

## Before I apply

You asked to see the SQL first. The migration tool shows you the full statement for approval before anything runs, so that requirement is met by the normal flow — nothing touches the database until you approve it.

## Open items I'll need from you before later stages

- The build brief document (blocks exact columns in prompts 2–5, the permission matrix in 6, notifications in 22)
- A decision on when to retire the legacy `courses`/`chapters`/`invites`/`user_roles` tables
