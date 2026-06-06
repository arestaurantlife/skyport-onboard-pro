## Plan: Server-Verified Certificate Issuance

### Scope

Make certificate issuance impossible from the client. The database becomes the only path to inserting a row in `certificates`, and it only does so after verifying every quiz attached to the course has a passing attempt by the caller.

### Database changes (one migration)

1. **Drop** the `Users insert own certificate` INSERT policy on `public.certificates`. Keep the two SELECT policies (own + manager/admin).

2. **Add** a SECURITY DEFINER function `public.issue_certificate_if_complete(_course_id uuid)`:
   - Requires `auth.uid()` (raises `not_authenticated` otherwise).
   - Resolves all quizzes belonging to `_course_id` (via `modules`).
   - If the course has zero quizzes → raises `course_has_no_quizzes` (prevents trivially "completing" an empty course).
   - Checks that for every such quiz the caller has at least one `quiz_attempts` row with `passed = true`. If not → raises `course_not_complete`.
   - If a certificate already exists for `(user_id, course_id)` → returns the existing row (idempotent, no duplicate insert).
   - Otherwise inserts a new row with a serial generated as `'SKY-' || upper(translate(encode(gen_random_bytes(6), 'base64'), '+/=', 'xyz'))` (cryptographically random, ~10 chars).
   - Returns `(certificate_id uuid, serial text, issued_at timestamptz, already_existed boolean)`.
   - `GRANT EXECUTE … TO authenticated`.

### App code changes

3. **`src/routes/_authenticated/quiz.$quizId.tsx`** — replace the client-side certificate flow after a passing `grade_quiz` result:
   - Remove the `quiz_attempts` fetch, the `allQuizIds.every(...)` check, the `certificates` SELECT/INSERT, and the `shortSerial()` call.
   - Replace with a single `supabase.rpc("issue_certificate_if_complete", { _course_id: courseId })` call.
   - If it returns a row and `already_existed === false`, show the existing "🎓 Certificate of completion issued!" toast.
   - If it raises `course_not_complete`, swallow silently (user just passed one quiz of many — that's expected).
   - Any other error → `toast.error(error.message)`.

4. **`src/lib/training-helpers.ts`** — remove the now-unused `shortSerial()` export.

### Security memory

5. Update `mem`/security memory to record:
   - Direct INSERT on `certificates` is forbidden; issuance only via `issue_certificate_if_complete`.
   - The new RPC is intentionally callable by `authenticated` — do not flag the corresponding linter warning.
   - Serials are now generated server-side from `gen_random_bytes`, not `Math.random()`.

### What this does NOT cover (separate findings, separate fixes)

- Manager-only RLS on `invites` INSERT (finding #2).
- `chapter_progress` enrollment check (finding #4).
- Restricting `outlets` SELECT to authenticated (finding #5).

Each is a distinct policy/code change; bundling them would conflate fixes. Happy to do them next.

### Files touched

- New migration (drops policy, adds RPC, grants EXECUTE).
- `src/routes/_authenticated/quiz.$quizId.tsx` (replace cert block with RPC call).
- `src/lib/training-helpers.ts` (remove `shortSerial`).
- Security memory note.
