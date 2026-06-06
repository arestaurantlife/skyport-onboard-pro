## 1. Admin login

An admin already exists in the database, so the "Claim admin" button on `/manager/admin` won't work for a second account. Two options:

- **A. Use the seeded test admin** — sign in at `/auth` with `test+admin@skyportco.test` (whatever password was set when seeded).
- **B. Promote your current Google account** (`arestaurant.life@gmail.com`) to admin via a one-line DB migration. This is the recommended option going forward. After it runs, sign out and back in, then open `/manager/admin` — you'll see the role toggles for every user and can grant `manager` / `admin` to others from the UI.

I'll go with **B** unless you say otherwise.

## 2. Email invites to new employees

Today managers create invites on `/manager` and copy the code manually. I'll add an "email this invite" flow.

**Backend**
- Set up Lovable's transactional email infrastructure (uses the `notify.newrestaurantsowners.com` domain you already configured).
- Add an `employee-invite` React Email template (branded: outlet name, job role, invite code, signup link, expiry).
- Store an optional `invitee_email` on `public.invites` so we can resend / audit.

**Manager UI (`/manager`)**
- Add an "Employee email" field next to Outlet / Job role.
- "Create invite" stays the same; a new "Create & email invite" button creates the invite, then calls `/lovable/email/transactional/send` with the new template.
- Each invite row gets a "Resend email" button when `invitee_email` is set.

**Recipient experience**
- Email contains the code + a one-click link to `/auth?mode=signup&code=ABC123` which prefills the invite field on the signup form.

## Technical details

- Migration: `INSERT INTO user_roles (user_id, role) VALUES ('7c73740e-…', 'admin')` and `ALTER TABLE invites ADD COLUMN invitee_email text`.
- Tools: `email_domain--setup_email_infra` (if not idempotent-skipped) then `email_domain--scaffold_transactional_email`.
- Template: `src/lib/email-templates/employee-invite.tsx`, registered in `registry.ts`.
- Send helper: `src/lib/email/send.ts` posting to `/lovable/email/transactional/send` with the user's Supabase JWT; `idempotencyKey = invite-${invite.id}`.
- `auth.tsx` reads `?code=` from the URL and prefills `inviteCode` state.
