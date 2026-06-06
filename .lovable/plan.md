## Certificate issuance audit log

Add a server-side audit trail capturing every certificate issuance attempt (success and rejection) tied to the employee and course.

### Database (one migration)

1. **New table `public.certificate_audit_log`**
   - `id uuid pk`, `user_id uuid not null` (the employee), `course_id uuid not null`, `certificate_id uuid null` (set on success), `outcome text not null` (enum-like: `issued`, `already_existed`, `course_not_complete`, `course_has_no_quizzes`, `not_authenticated`), `reason text` (human-readable detail, e.g. "5 of 7 quizzes passed"), `quizzes_required int`, `quizzes_passed int`, `created_at timestamptz default now()`.
   - GRANTs: `SELECT` to `authenticated` (policy-gated), `ALL` to `service_role`. No INSERT/UPDATE/DELETE from clients — only the SECURITY DEFINER function writes.
   - RLS policies (SELECT only):
     - Employee can read their own rows: `user_id = auth.uid()`.
     - Managers/admins can read all rows: `has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin')`.
   - Index on `(user_id, created_at desc)` and `(course_id, created_at desc)`.

2. **Update `public.issue_certificate_if_complete(_course_id)`**
   - Before each `RAISE EXCEPTION` and before returning success/already-existed, `INSERT` an audit row with the appropriate `outcome`, `reason`, and quiz counts.
   - Keep return shape unchanged so the existing client call site doesn't change.
   - Wrap rejection inserts so they commit even though the function raises (use a small `PERFORM` helper or insert + raise; since SECURITY DEFINER raises abort the tx, switch failure paths to insert-then-raise inside a sub-block using `BEGIN ... EXCEPTION` is not needed — instead: log first, then raise. Postgres rolls back inserts on raise, so use `pg_background`-free pattern: log via a `SECURITY DEFINER` helper called with `PERFORM` in an autonomous-style workaround → simplest: change failure paths from `RAISE EXCEPTION` to `RETURN` with an `outcome` column, OR keep raise but commit the audit by using `dblink`. **Chosen approach:** change the function to never raise — return the existing 4 columns plus a new `outcome text` column. Client maps `outcome` to UI. This keeps audit inserts in the same transaction and avoids dblink/background workers.

3. **Function signature change**
   - Return: `certificate_id uuid, serial text, issued_at timestamptz, already_existed bool, outcome text`.
   - `outcome` values: `issued`, `already_existed`, `course_not_complete`, `course_has_no_quizzes`.
   - `not_authenticated` still raises (no session = no audit row possible).

### App code

4. **`src/routes/_authenticated/quiz.$quizId.tsx`**
   - Read `outcome` from the RPC response. Show success toast on `issued`, silent on `already_existed` / `course_not_complete` (current behavior), surface an error toast for unexpected outcomes.

5. **New manager view (small)**
   - Add `src/routes/_authenticated/manager.audit.tsx` listing recent audit rows (employee name via join on `profiles`, course title, outcome badge, reason, timestamp). Filter inputs for employee and course. Manager/admin only (RLS enforces; UI hides link for employees via existing role check pattern used in `manager.index.tsx`).
   - Link from `manager.index.tsx` to the new audit page.

### Out of scope
- Audit for other actions (quiz attempts, invite usage, chapter completion).
- Export/CSV download — can be added later.
- The other open findings (invite RLS, chapter_progress enrollment check, outlets visibility).

### Security memory
- Add: "Certificate issuance attempts are audited in `certificate_audit_log`; rows are written by `issue_certificate_if_complete` only. Clients cannot insert/update/delete. Employees read own rows; managers/admins read all."
