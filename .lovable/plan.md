# Skyportco Training Platform — MVP Plan

A Thinkific-inspired LMS for new hires at Skyportco / First Meridian Services (Denver International Airport). MVP focuses on one fully-built sample outlet and one role, with the engine designed so additional outlets/roles plug in cleanly.

## What gets built in v1

### Public / marketing

- **Landing page** — Skyportco brand, value prop, DEN airport context, "Employee sign in" + "Manager sign in" CTAs. Thinkific-style hero, feature grid, testimonial-style outlet logos.
- **About / Company** page — company overview, directors & managers (placeholder names), DEN locations summary.

### Authentication (Lovable Cloud)

- Email + password auth.
- **Manager-invited employees**: managers create invite codes tied to `{outlet, role}`. Employee signs up using the code, which auto-assigns their outlet + role.
- Roles in system: `employee`, `manager`, `admin`.
- Job roles (separate from auth role): line cook, hostess, server, bartender, food runner, dishwasher, prep cook, supervisor, new manager.

### Employee experience

- **Dashboard** — assigned 5-day course, progress %, next lesson, certificate status.
- **Course player (Thinkific-style)**:
  - Left sidebar: Day 1–5, each with 4–6 chapters.
  - Main pane: embedded video (YouTube/Vimeo/Loom URL), written lesson content, "Mark complete" button.
  - Per-chapter or per-day quiz (multiple choice, pass threshold 80%). Retake allowed.
- **5-day structure** (~6–8 hrs/day of content):
  - Orientation Day: Company & brand (Skyportco, First Meridian, DEN context, directors/managers, norms & rules), Role-specific training (menu knowledge, hours of operation, station duties), HR policies, uniform, attendance, harassment, importance of employee badge at DEN, don't misplace your badge or no work, employee will meet with General Manager of the restaurant he will be working and will receive a training schedule with Day 1 to Day 5, Get introduced and log into the app "7Shifts" for scheduling porpuses. 
  - Day 1: Received a menu copy of food and drinks offered at the restaurant outlet, Introduced to staff for the role of the new employee was hire, first day following a lead employee that will show all the basics of the restaurant areas, restaurant opening and closing procedures plus the running operations side work and the role he was hired depending of the role he was hired, soft-drinks and food knowledge training and quiz at the end of day 1, quiz should include 5 things employee have learned on day 1 plus soft drinks and food menu knowledge for day 1, quiz will include asking names of all managers and directors, restaurant hours of operations, restaurant brand and mision and POS knowledge if needed.
  - Day 2: Follow a lead employee that will show all the basics of the restaurant and the role he was hired depending of the role he was hired and POS knowledge if needed, + quiz of the day 2, quiz should include 5 things employee have learned on day 2 different from day 1,  Food safety training (ServSafe-style) + quiz from food safety, have 10 questions regarding food safety with simple selection 4 possible answers, only one answer will be correct. POS knowledge if needed.
  - Day 3: Follow a lead employee that will show all the basics of the restaurant and the role he was hired depending of the role he was hired + quiz of the day 3, quiz should include 5 things employee have learned on day 3 different from day 2,  Alcohol safety (TIPS-style) + quiz — required for bartender/server, optional for others, have 10 questions regarding alcohol safety (TIPS-style) with simple selection 4 possible answers only one answer will be correct. POS knowledge if needed.
  - Day 4: Follow a lead employee that will show all the basics of the restaurant and the role he was hired depending of the role he was hired, employee will try to excecute duties realted to the role he was hired supervise by a lead employee to create confident work place on his roll and new employee will ask questions if needed, new employee will receive a trainning course to learn the difference between service and hospitality + Quiz related to the difference beetwen service and hospitality, 8 questions with 4 possible answer only one will be right.
  - Day 5: New employee will try to excecute duties realted to the role he was hired supervise by a lead employee to create confident work place on his roll and new employee will ask questions if needed,  Final exam and serve a manager as a guest depending of the role of the new employee.
- **Certificate of completion** — generated when all required modules pass; printable view (clean A4 layout, name, outlet, role, date, signature lines). managers and HR will received an email notification that the new employee have finished training for the restaurant oiutlet he was hired.

### Manager experience

- **Manager dashboard** — list of their employees, progress bar per employee, last activity, quiz scores.
- **Invite tool** — generate invite code, choose outlet + role, copy link.
- **Drill-in view** — per-employee chapter completion, quiz scores, flagged weak areas (any quiz < 80% surfaces as "needs review").
- Email/in-app notifications can be added later; MVP uses a manager dashboard badge.

### Sample content (placeholder, editable later)

- One sample outlet (e.g. "Mesa Verde Cantina") fully populated.
- One role (Server) fully populated with menu items, hours, station notes.
- Skeleton entries for other outlets/roles so structure is visible.

## Out of scope for v1 (planned for next iterations)

- Admin CMS for non-technical content editing (managers will request changes; v2 adds full CMS).
- Video uploads (external embed only in v1).
- Email notifications, SMS, Slack.
- Multi-language.
- Payment / billing (internal tool).
- Mobile native apps (responsive web only).

## Data model (Lovable Cloud / Postgres)

```text
profiles            (id, full_name, job_role, outlet_id, hired_at)
user_roles          (user_id, role)  -- 'employee' | 'manager' | 'admin'
outlets             (id, name, concept, hours, manager_name, brand_description)
invites             (code, outlet_id, job_role, created_by, used_by, expires_at)
courses             (id, title, job_role, outlet_id_nullable)
modules             (id, course_id, day_number, order, title)
chapters            (id, module_id, order, title, video_url, body_markdown)
quizzes             (id, chapter_id_or_module_id, pass_threshold)
quiz_questions      (id, quiz_id, prompt, choices_json, correct_index)
progress            (user_id, chapter_id, completed_at)
quiz_attempts       (id, user_id, quiz_id, score, passed, taken_at)
certificates        (id, user_id, course_id, issued_at, serial)
```

RLS: employees see only their own progress; managers see employees whose `outlet_id` matches an outlet they manage; admin sees all. Roles stored in `user_roles` (per security best practice).

## Technical approach

- **Stack**: TanStack Start (already scaffolded) + Tailwind + shadcn/ui + Lovable Cloud (Postgres + auth).
- **Routing**: `/`, `/about`, `/auth`, `/_authenticated/dashboard`, `/_authenticated/courses/$courseId`, `/_authenticated/courses/$courseId/chapters/$chapterId`, `/_authenticated/certificate/$id`, `/_authenticated/manager`, `/_authenticated/manager/employees/$id`.
- **Design**: Thinkific-inspired — clean white surfaces, strong primary brand color (deep navy + warm accent suggesting hospitality/airport), generous spacing, sidebar course nav, large progress indicators. Tokens defined in `src/styles.css`.
- **Server functions** for all DB reads/writes; admin client only for invite validation flows.

## Build order

1. Enable Lovable Cloud, create schema + RLS, seed sample outlet/course/quiz data.
2. Auth pages, invite-code signup, role assignment.
3. Employee dashboard + course player + quiz engine + progress tracking.
4. Certificate generation + printable view.
5. Manager dashboard + invite generator + employee drill-in.
6. Landing + About pages, polish, responsive pass.

## Questions you can still change later

- Specific brand colors / logo — I'll pick a confident Skyportco-feeling palette; swap anytime.
- Real outlet list, manager names, real menus — drop them in chat and I'll replace placeholders.