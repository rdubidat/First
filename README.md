# 🥋 DojoOS — Martial Arts School CRM

A martial-arts-native CRM built to replace GoHighLevel for MACE and become a
sellable product to UK martial arts schools. Not a generic CRM with a martial
arts skin: **the grading engine, attendance-decay retention system, and family
billing model are the product.**

The app runs in two modes:

- **Demo mode** (default, zero setup): the production data model and all the
  core engines running entirely in the browser against a seeded MACE-scale
  dataset (localStorage persistence).
- **Live mode**: connect a Supabase project (see [SETUP.md](SETUP.md)) and
  the app gains staff logins, a real Postgres database with row-level
  security, and write-through sync across devices. Same UI, same engines.

## Run it

```bash
npm install
npm run dev      # open the printed URL
npm run build    # production build
```

The app seeds itself with a realistic dataset on first load (24 families,
~30 students, 12 weeks of attendance history with deliberately decaying
students, payment failures, open leads). Reset it any time from **Settings →
Reset demo data**.

## What's implemented (PRD §3, Phase 1)

| Module | Where | Notes |
|---|---|---|
| **Member management** | Members | Family accounts (one payer, many students), statuses, medical notes, photo consent, GDPR export + right-to-erasure |
| **Attendance** | Kiosk, Classes | Full-screen tap-name kiosk, instructor register view, history feeding the retention engine |
| **Grading engine** | Grading | Curriculum per programme, eligibility = min classes + min time at grade, grading events with bookings/payment/results, auto grade update + certificate on pass |
| **Billing** | Billing | Plans, family discounts (% off 2nd+ student), freeze with holding fee, pro-rata, failed-payment dunning (retry day 3/5/7 + SMS + task), MRR dashboard |
| **Retention engine** | Retention | Attendance-decay scoring (consecutive missed weeks, trend, grading stall, payment friction), at-risk board, scan fires parent nudge + instructor task |
| **Sales pipeline** | Pipeline | Kanban lead → signed, speed-to-lead (instant SMS + email + call task), trial 24h/2h reminders, one-click convert to family + subscription |
| **Communications** | Inbox, everywhere | Message-intent → adapter architecture (Twilio SMS / Gmail / tap-to-send `sms:`/`wa.me` links), native STOP handling, quiet-hours holds, templates, class broadcasts, usage metered at cost + transparent margin |

## Phase 2 marketing layer (PRD §4)

| Module | Where | Notes |
|---|---|---|
| **Content engine** | Content | CRM events (grading passes, new joins, first classes) auto-draft social posts in the school's voice — photo-consent aware; drafts → schedule → publish via direct Meta Graph / GBP APIs. Demo drafts from templates; production swaps in the Anthropic API behind the same contract |
| **Review engine** | Growth | Google review request fires automatically on every grading pass; review monitoring + reply tracking |
| **Email campaigns** | Campaigns | Segmentation by programme and attendance band (powered by the retention engine); marketing consent is a hard filter; Gmail send caps surfaced, Resend routing when exceeded |
| **Referrals** | Growth | Referred leads tracked end-to-end; conversion flips automatically when the lead signs, reward task created |
| **AI receptionist** | Receptionist | Out-of-hours FAQ + free-trial booking (creates a lead → speed-to-lead fires); escalates unanswerable questions to a team task. Rule-based demo brain, Anthropic API in production behind the same `respond()` contract |

## Architecture

```
src/
  data/
    seed.js          # deterministic MACE-scale demo dataset
    store.jsx        # React store mirroring the production schema;
                     # every mutation emits domain events. Two providers:
                     # demo (localStorage) and live (Supabase auth + sync)
    codec.js         # camelCase docs <-> snake_case Postgres rows
    remote.js        # live mode: school loader + diff-based write-through
  engine/
    comms.js         # message intents, adapters, opt-out + quiet hours (UK A2P)
    automations.js   # event-subscribed rules: speed-to-lead, decay nudges,
                     # dunning, belt congrats + review request + auto post,
                     # first-class follow-up, referral conversion
    retention.js     # attendance-decay risk scoring
    grading.js       # eligibility rules + curriculum progression
    billing.js       # family discounts, freezes, pro-rata, MRR
    content.js       # content engine drafts + AI receptionist brain
    campaigns.js     # consent-gated campaign segmentation
  pages/             # Dashboard, Members, Classes, Kiosk, Grading,
                     # Retention, Pipeline, Inbox, Billing, Content,
                     # Campaigns, Growth, Receptionist, Settings
db/
  schema.sql         # reference design: full relational schema with FKs,
                     # message intents, soft deletes (Phase 3 target)
supabase/
  migrations/001_init.sql  # operational live-mode schema the app syncs
                           # against (RLS per school, sync-resilient)
```

**Event-driven core:** every action (check-in, payment failed, grade awarded,
lead created) emits an event; automations subscribe to events and produce
message intents + tasks. In production the same rules run in a queue worker
(Inngest / pg-cron); here they run synchronously in the store so the whole
loop is demonstrable.

**Multi-tenant from day one:** `school_id` on every table with row-level
security — see `db/schema.sql`. The demo runs one tenant (MACE) but nothing
assumes it.

## Path to production (build vs buy, PRD §2)

Build the vertical layer, rent the plumbing:

- **Backend:** Postgres (Supabase/Neon) using `db/schema.sql`; the store
  actions in `src/data/store.jsx` map 1:1 to API endpoints; the engine modules
  are pure functions that move server-side unchanged.
- **Payments:** Stripe (MVP, zero migration risk) → GoCardless Direct Debit
  in Phase 2 (~1% capped 20p, lower involuntary churn). Never touch card data.
- **SMS:** Twilio direct — one local number per school, UK A2P sender
  registration, inbound webhook → `messages` + native STOP handling.
- **Email:** Gmail OAuth per school (send-as + inbound sync); Resend when
  broadcast volume exceeds Gmail limits.
- **WhatsApp:** tap-to-send (`wa.me`) now; Cloud API adapter slots into the
  intent layer in Phase 2 with no rewrite — start Meta business verification
  early.
- **Jobs:** scheduled sends (`message_intents.scheduled_for`), dunning
  retries, and the nightly decay scan move to a queue worker.

## Not yet built (PRD §4–5 remainder)

WhatsApp Cloud API (start Meta business verification early), blog/SEO engine,
VoIP + missed-call text-back, parent portal PWA, class capacity caps +
waitlists, pro shop/inventory, instructor payroll, safeguarding suite,
multi-tenant onboarding flow. The data model already leaves room for them
(capacity on classes, `whatsapp` channel enum, portal `auth_id` on families).
