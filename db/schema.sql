-- DojoOS — multi-tenant Postgres schema (Phase 1 MVP)
-- =====================================================
-- Principles (PRD §6):
--   * Multi-tenant from day one: school_id on every table, enforced by RLS.
--   * Event-driven core: every action emits a row in `events`; automations
--     (queue worker) subscribe to events and produce message intents + tasks.
--   * Soft-delete everything (deleted_at); GDPR erasure is a hard-delete job.
--   * Money is integer pence. Times are timestamptz. UK locale assumptions
--     live in school settings, not in the schema.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenancy & staff
-- ---------------------------------------------------------------------------

create table schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  timezone      text not null default 'Europe/London',
  -- Comms config
  twilio_number text,                       -- dedicated local number per school
  gmail_oauth   jsonb,                      -- token refs for send-as + inbound sync
  -- Compliance + billing rules
  settings      jsonb not null default '{
    "quiet_start": "20:30",
    "quiet_end": "08:00",
    "family_discount_pct": 15,
    "freeze_fee_pence": 500,
    "platform_margin_pct": 20
  }'::jsonb,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table staff_users (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id),
  auth_id     uuid not null,                -- Supabase Auth / Clerk subject
  role        text not null check (role in ('owner','instructor','admin')),
  name        text not null,
  email       text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (school_id, auth_id)
);

-- ---------------------------------------------------------------------------
-- Members: one payer (family), many students, single login (Phase 3 portal)
-- ---------------------------------------------------------------------------

create table families (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id),
  payer_name   text not null,
  email        text,
  phone        text,
  auth_id      uuid,                        -- parent portal login (Phase 3)
  opt_out_sms  boolean not null default false,
  status       text not null default 'active'
               check (status in ('active','archived')),
  -- GDPR consent records
  consent      jsonb not null default '{}'::jsonb,  -- {marketing: bool, recorded_at, source}
  -- Payment provider references (never store card data)
  stripe_customer_id     text,
  gocardless_customer_id text,              -- Phase 2
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table students (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id),
  family_id         uuid not null references families(id),
  first_name        text not null,
  last_name         text not null,
  dob               date,
  status            text not null default 'lead'
                    check (status in ('lead','trial','active','frozen','cancelled','alumni')),
  medical_notes     text,
  photo_consent     boolean not null default false,
  emergency_contact text,
  joined_at         timestamptz,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index on students (school_id, status);
create index on students (family_id);

-- ---------------------------------------------------------------------------
-- Curriculum: programmes -> grades, with eligibility rules per grade
-- ---------------------------------------------------------------------------

create table programmes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id),
  name        text not null,
  age_band    text,
  color       text,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table grades (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id),
  programme_id      uuid not null references programmes(id),
  name              text not null,
  sort_order        int  not null,
  -- Eligibility rules to ATTAIN this grade
  min_classes       int  not null default 0,
  min_days_at_grade int  not null default 0,
  grading_fee_pence int  not null default 0,
  unique (programme_id, sort_order)
);

create table enrolments (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id),
  student_id       uuid not null references students(id),
  programme_id     uuid not null references programmes(id),
  grade_id         uuid references grades(id),
  grade_awarded_at timestamptz,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (student_id, programme_id)
);

-- ---------------------------------------------------------------------------
-- Classes & attendance (feeds the retention engine)
-- ---------------------------------------------------------------------------

create table classes (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id),
  programme_id  uuid not null references programmes(id),
  name          text not null,
  day_of_week   int  not null check (day_of_week between 0 and 6),  -- Monday = 0
  start_time    time not null,
  duration_mins int  not null default 45,
  location      text,
  capacity      int,                        -- caps + waitlists in Phase 3
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table attendance (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id),
  class_id      uuid not null references classes(id),
  student_id    uuid not null references students(id),
  class_date    date not null,
  checked_in_at timestamptz not null default now(),
  method        text not null default 'kiosk' check (method in ('kiosk','qr','register')),
  unique (class_id, student_id, class_date)
);

create index on attendance (school_id, student_id, class_date desc);
create index on attendance (class_id, class_date);

-- ---------------------------------------------------------------------------
-- Billing: plans, subscriptions, payments (Stripe MVP, GoCardless Phase 2)
-- ---------------------------------------------------------------------------

create table plans (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id),
  name          text not null,
  programme_ids uuid[] not null default '{}',
  amount_pence  int  not null,
  interval      text not null default 'month' check (interval in ('month','week','year')),
  provider      text not null default 'stripe' check (provider in ('stripe','gocardless')),
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table subscriptions (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id),
  family_id        uuid not null references families(id),
  student_id       uuid not null references students(id),
  plan_id          uuid not null references plans(id),
  status           text not null default 'active'
                   check (status in ('active','frozen','cancelled')),
  provider         text not null default 'stripe',
  provider_sub_id  text,                    -- Stripe subscription id
  started_at       timestamptz not null default now(),
  frozen_at        timestamptz,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index on subscriptions (school_id, status);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id),
  family_id       uuid not null references families(id),
  subscription_id uuid references subscriptions(id),
  amount_pence    int  not null,
  type            text not null check (type in ('subscription','grading','trial','shop')),
  status          text not null check (status in ('paid','failed','retrying','refunded')),
  provider        text not null default 'stripe',
  provider_ref    text,                     -- PaymentIntent / payout reference
  fail_reason     text,
  retry_count     int  not null default 0,
  next_retry_at   timestamptz,              -- dunning: day 3, 5, 7 then escalate
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index on payments (school_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Sales pipeline
-- ---------------------------------------------------------------------------

create table leads (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id),
  name         text not null,
  student_name text,
  age          int,
  phone        text,
  email        text,
  programme_id uuid references programmes(id),
  source       text not null default 'manual',     -- meta_lead_form | website_form | ...
  stage        text not null default 'lead'
               check (stage in ('lead','contacted','trial_booked','trial_attended','offer','signed','lost')),
  opt_out_sms  boolean not null default false,
  trial_at     timestamptz,
  notes        text,
  converted_family_id uuid references families(id),
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index on leads (school_id, stage);

-- ---------------------------------------------------------------------------
-- Grading events
-- ---------------------------------------------------------------------------

create table grading_events (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id),
  programme_id uuid not null references programmes(id),
  name         text not null,
  event_date   date not null,
  fee_pence    int  not null default 0,
  status       text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table grading_bookings (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id),
  grading_event_id uuid not null references grading_events(id),
  student_id       uuid not null references students(id),
  payment_id       uuid references payments(id),
  result           text not null default 'pending' check (result in ('pending','pass','fail','no_show')),
  new_grade_id     uuid references grades(id),
  certificate_url  text,                    -- generated PDF on pass
  created_at       timestamptz not null default now(),
  unique (grading_event_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Comms: message intents -> adapter deliveries, all logged to the timeline
-- ---------------------------------------------------------------------------

-- An intent is what an automation (or a human) wants to say. The worker
-- resolves it through compliance checks (opt-out, quiet hours) to a delivery.
create table message_intents (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id),
  family_id     uuid references families(id),
  lead_id       uuid references leads(id),
  channel       text not null check (channel in ('sms','email','whatsapp','tap_sms','tap_whatsapp')),
  subject       text,
  body          text not null,
  automation    text,                       -- rule that produced it, null = manual
  scheduled_for timestamptz,                -- trial reminders, quiet-hours holds
  status        text not null default 'queued'
                check (status in ('queued','scheduled','sent','delivered','failed',
                                  'blocked_optout','held_quiet_hours','sent_from_device','cancelled')),
  created_at    timestamptz not null default now(),
  check (family_id is not null or lead_id is not null)
);

create index on message_intents (school_id, status, scheduled_for);

-- Every message in or out, any channel — the contact timeline.
create table messages (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id),
  family_id     uuid references families(id),
  lead_id       uuid references leads(id),
  intent_id     uuid references message_intents(id),
  channel       text not null,
  direction     text not null check (direction in ('in','out')),
  subject       text,
  body          text not null,
  provider_ref  text,                       -- Twilio SID / Gmail message id
  cost_pence    int  not null default 0,    -- metered for usage billing at cost + margin
  status        text not null,
  created_at    timestamptz not null default now()
);

create index on messages (school_id, family_id, created_at desc);
create index on messages (school_id, lead_id, created_at desc);

create table message_templates (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools(id),
  name       text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Event-driven core + tasks
-- ---------------------------------------------------------------------------

create table events (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools(id),
  type       text not null,                 -- student.checked_in, payment.failed, ...
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on events (school_id, type, created_at desc);

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id),
  title        text not null,
  due_at       timestamptz,
  related_type text,                        -- lead | family | student
  related_id   uuid,
  assignee_id  uuid references staff_users(id),
  status       text not null default 'open' check (status in ('open','done','cancelled')),
  created_by   text not null default 'user' check (created_by in ('user','automation')),
  created_at   timestamptz not null default now()
);

create index on tasks (school_id, status, due_at);

-- ---------------------------------------------------------------------------
-- Row-level security: every tenant table is scoped to the caller's school.
-- app.current_school_id is set per-connection by the API layer (or derived
-- from the JWT under Supabase: auth.jwt() ->> 'school_id').
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'staff_users','families','students','programmes','grades','enrolments',
    'classes','attendance','plans','subscriptions','payments','leads',
    'grading_events','grading_bookings','message_intents','messages',
    'message_templates','events','tasks'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy tenant_isolation on %I using (school_id = current_setting(''app.current_school_id'')::uuid)', t
    );
  end loop;
end $$;
