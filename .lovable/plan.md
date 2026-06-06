## Navigation audit & link fixes

You skipped the clarifying question, so I'll do a full link/navigation pass across the app and fix anything that doesn't resolve.

### Static audit (already done)
Every `<Link to=...>` in the codebase targets a real route file:

| Link | Route file | Status |
|---|---|---|
| `/` | `routes/index.tsx` | ✓ |
| `/auth` | `routes/auth.tsx` | ✓ |
| `/about` | `routes/about.tsx` | ✓ |
| `/dashboard` | `_authenticated/dashboard.tsx` | ✓ |
| `/manager` | `_authenticated/manager.index.tsx` | ✓ |
| `/manager/audit` | `_authenticated/manager.audit.tsx` | ✓ |
| `/manager/employees/$id` | `_authenticated/manager.employees.$id.tsx` | ✓ |
| `/courses/$courseId` | `_authenticated/courses.$courseId.tsx` | ✓ |
| `/learn/$chapterId` | `_authenticated/learn.$chapterId.tsx` | ✓ |
| `/quiz/$quizId` | `_authenticated/quiz.$quizId.tsx` | ✓ |
| `/certificate/$courseId` | `_authenticated/certificate.$courseId.tsx` | ✓ |

No dead `Link` targets, no `<a href>` interpolation of params, all dynamic links pass `params` correctly.

### Runtime verification (build step)
1. Open the preview in the browser, sign in as a test user, and click through every nav surface:
   - Site header: Home, About, Dashboard, Sign in, Get started
   - Landing CTAs: Start training, How it works, Enter invite code
   - Auth page: switch between sign-in / sign-up
   - Dashboard: Course "Start/Continue training", "View certificate", "Manager dashboard"
   - Course page: chapter links, quiz links, "Continue training" CTA
   - Chapter page: Previous, Mark complete & continue (→ next chapter/quiz/overview), CourseSidebar items
   - Quiz page: Submit → "Back to course", Retake
   - Manager dashboard: "Certificate audit", "My training", "View" employee
   - Manager employee detail: "Manager dashboard" back link
   - Manager audit: "Back to dashboard"
   - Certificate page: "Back" / "Dashboard"
2. Watch the browser console for navigation errors and the network tab for 404s.

### Fixes I'll apply if found
- Any `<Link>` whose `to=` doesn't match a generated route ID (filename mismatch).
- Any dynamic link missing `params=` (would error at runtime).
- Any `<a href>` that should be `<Link>` for client-side routing.
- Role-gate the "Manager dashboard" button on `dashboard.tsx` so employees without manager/admin role don't see a link to a page that will reject them.
- Anything else surfaced during click-through.

### If nothing's broken
I'll report exactly that and ask you to point at the specific link that misbehaves.

### Out of scope
- Redesigning navigation IA (adding new pages, footer nav, breadcrumbs) — say the word if you want any of these.
- Anything outside link/navigation behavior.
