# Going live: connect DojoOS to a real database

Without configuration the app runs in **demo mode** (data in each browser's
localStorage). Connecting Supabase turns on **live mode**: staff logins, a
real Postgres database, and changes synced across every device. ~10 minutes.

## 1. Create the Supabase project (free tier is fine)

1. Go to [supabase.com](https://supabase.com) → sign in → **New project**
2. Name it `dojoos`, pick a strong database password (you won't need it
   day-to-day), region **West EU (London)**
3. Wait ~2 minutes for the project to provision

## 2. Create the database schema

1. In the Supabase dashboard: **SQL Editor → New query**
2. Paste the entire contents of [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
3. Click **Run** — you should see "Success. No rows returned"

## 3. Auth settings (one toggle)

1. **Authentication → Sign In / Up → Email**
2. For the quickest start, turn **off** "Confirm email" (you can re-enable it
   once real staff accounts exist). If you leave it on, each staff member
   clicks a confirmation link before first sign-in.

## 4. Give the app its keys

1. In Supabase: **Project Settings → API** — copy the **Project URL** and the
   **anon public** key
2. In Railway: open the service → **Variables** → add:
   - `VITE_SUPABASE_URL` = the project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon key
3. Railway rebuilds automatically (the keys are baked in at build time —
   the anon key is safe to expose; row-level security does the protecting)

For local dev, put the same two lines in a `.env.local` file instead.

## 5. First run

1. Open the app → you'll see the **staff sign-in** screen instead of the demo
2. **Create an account** → sign in → **Set up your school**
3. Choose "Start with example data" to explore, or untick for a clean slate
4. You're live: every change saves to Postgres (watch the "All changes saved"
   indicator at the bottom of the sidebar), and any colleague who signs up
   can be linked to your school via a `staff_users` row

## Adding more staff (for now)

v1 has no invite UI yet. To add a colleague: have them create an account on
the sign-in screen, then in Supabase run:

```sql
insert into staff_users (id, school_id, auth_id, role, name, email)
select 'staff_' || substr(md5(random()::text), 1, 8),
       (select id from schools limit 1),
       id, 'instructor', email, email
from auth.users where email = 'colleague@example.com';
```

They'll land in your school on next sign-in. An invite flow is on the
Phase 3 list (multi-tenant onboarding).

## What live mode does and doesn't do yet

| Works now | Still simulated |
|---|---|
| Staff logins, sessions, roles | SMS sending (Twilio) — messages log with realistic statuses but don't leave the building |
| Real Postgres persistence, multi-device | Email sending (Gmail OAuth) |
| Row-level security per school (multi-tenant) | Card payments (Stripe webhooks) |
| GDPR export & hard-delete erasure | AI receptionist brain (rule-based; Anthropic API in production) |
| All engines: grading, retention, billing logic, automations | |

The integrations column is deliberate: each one needs its own account,
credentials and webhook endpoint (see PRD §10 — start Twilio sender
registration and the Google OAuth consent screen early). The comms adapter
layer is already shaped for them; they slot in without rewrites.
