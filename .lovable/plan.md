## Plan: Per-Outlet Seeding for Test Users + Courses

### Outlet assignments

11 test users distributed across the 3 outlets. Each user emailed `test+<slug>@skyportco.test`, password `TestPass!2026`, flagged `is_test_account = true`.

**Mesa Verde Cantina** (existing course)
- `test+server` — server
- `test+hostess` — hostess
- `test+bartender` — bartender
- `test+manager` — manager role (oversees Mesa Verde roster)

**Altitude Burger Co.**
- `test+linecook` — line_cook
- `test+prepcook` — prep_cook
- `test+dishwasher` — dishwasher
- `test+foodrunner` — food_runner

**Rocky Brew Coffee**
- `test+supervisor` — supervisor
- `test+newmanager` — new_manager
- `test+admin` — admin role (cross-outlet visibility; outlet_id = Rocky Brew for profile completeness)

### Course cloning

Clone the existing Mesa Verde "Server Training" course (modules → chapters → quizzes → quiz_questions) into two new courses, one per outlet:
- `Server Training — Altitude Burger Co.` (outlet_id = Altitude)
- `Server Training — Rocky Brew Coffee` (outlet_id = Rocky Brew)

Cloning preserves structure (same module/chapter/quiz/question counts and content) so course-player, quiz, and certificate pages render identically for users at any outlet. New UUIDs for every cloned row; passing-score and ordering copied verbatim.

### Schema change

Add `is_test_account boolean NOT NULL DEFAULT false` to `profiles` so test fixtures are identifiable and can be excluded from production manager rosters later.

### Seeding script

`scripts/seed-test-users.ts` (run with `bun scripts/seed-test-users.ts`):

1. Reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from env.
2. **Idempotent course clone**: looks up Mesa Verde course; for each of Altitude + Rocky Brew, upserts a clone keyed by `(outlet_id, title)`. Skips if clone already exists.
3. **Idempotent user creation**: for each of the 11 fixtures, calls `auth.admin.listUsers` → if email exists, reuses id; else `auth.admin.createUser({ email_confirm: true })`.
4. Upserts `profiles` row with `outlet_id`, `job_role`, `full_name`, `is_test_account = true`.
5. Upserts `user_roles` row (`employee` / `manager` / `admin` per fixture).
6. Logs created vs reused count per user for CI visibility.

Script is server-only; never imported into app code. Service role key stays in env.

### Playwright fixture exposure

`tests/e2e/fixtures/test-users.ts` exports the 11 fixtures (email, password, role, outlet name, expected course title) so each Playwright spec can sign in as a role and assert the correct outlet + course render.

### Files

- New migration: `is_test_account` column on `profiles`
- New: `scripts/seed-test-users.ts`
- New: `tests/e2e/fixtures/test-users.ts`
- No app code changes

### Out of scope

- Production filter to hide `is_test_account` users from manager rosters (follow-up)
- Cleanup script (manual delete via dashboard)
- Writing the Playwright specs themselves (next step after seeding lands)
