-- DojoOS — operational Supabase schema (v1 live mode)
-- =====================================================
-- This is the schema the app actually syncs against. Column names are the
-- snake_case mirror of the client store's fields (see src/data/codec.js);
-- ISO timestamps are stored as text to keep the codec symmetric. The richer
-- relational design with FK constraints lives in db/schema.sql and is the
-- target for the Phase 3 backend; this version favours sync resilience
-- (no FK ordering issues during batched writes/GDPR erasure).
--
-- Run this once in the Supabase SQL editor on a fresh project.

-- ---------------------------------------------------------------------------
-- Tenancy + staff
-- ---------------------------------------------------------------------------

create table schools (
  id            text primary key,
  name          text not null,
  slug          text,
  timezone      text default 'Europe/London',
  sender_number text,
  settings      jsonb not null default '{}'::jsonb
);

create table staff_users (
  id        text primary key,
  school_id text not null,
  auth_id   uuid not null,
  role      text not null default 'owner',
  name      text,
  email     text,
  unique (auth_id, school_id)
);

-- All staff of a school may read/write that school's rows.
create or replace function public.user_school_id()
returns text language sql stable security definer set search_path = public as $$
  select school_id from staff_users where auth_id = auth.uid() limit 1
$$;

-- ---------------------------------------------------------------------------
-- Tenant collections (mirror of the client store)
-- ---------------------------------------------------------------------------

create table programmes (
  id text primary key, school_id text not null,
  name text not null, age_band text, color text
);

create table grades (
  id text primary key, school_id text not null,
  programme_id text not null, name text not null, sort_order int not null,
  min_classes int not null default 0, min_days int not null default 0,
  grading_fee_pence int not null default 0
);

create table classes (
  id text primary key, school_id text not null,
  programme_id text not null, name text not null,
  day_of_week int not null, time text not null,
  duration_mins int not null default 45, location text
);

create table plans (
  id text primary key, school_id text not null,
  name text not null, programme_ids jsonb not null default '[]'::jsonb,
  amount_pence int not null, interval text not null default 'month',
  provider text not null default 'stripe'
);

create table families (
  id text primary key, school_id text not null,
  payer_name text not null, email text, phone text,
  opt_out_sms boolean not null default false,
  consent jsonb not null default '{}'::jsonb,
  status text not null default 'active', created_at text
);

create table students (
  id text primary key, school_id text not null, family_id text not null,
  first_name text not null, last_name text not null, dob text,
  status text not null default 'trial', medical_notes text,
  photo_consent boolean not null default false,
  emergency_contact text, joined_at text, profile text
);

create table enrolments (
  id text primary key, school_id text not null,
  student_id text not null, programme_id text not null,
  grade_id text, grade_awarded_at text
);

create table subscriptions (
  id text primary key, school_id text not null,
  family_id text not null, student_id text not null, plan_id text not null,
  status text not null default 'active', provider text not null default 'stripe',
  started_at text
);

create table attendance (
  id text primary key, school_id text not null,
  class_id text not null, student_id text not null,
  date text not null, checked_in_at text, method text not null default 'kiosk'
);
create index on attendance (school_id, student_id, date);

create table payments (
  id text primary key, school_id text not null,
  family_id text not null, subscription_id text,
  amount_pence int not null, type text not null, status text not null,
  provider text not null default 'stripe', date text not null,
  fail_reason text, retry_count int, next_retry_at text
);

create table leads (
  id text primary key, school_id text not null,
  name text not null, student_name text, age int, phone text, email text,
  programme_id text, source text not null default 'manual',
  stage text not null default 'lead', opt_out_sms boolean not null default false,
  notes text, trial_at text, referrer_family_id text, created_at text
);

create table grading_events (
  id text primary key, school_id text not null,
  programme_id text not null, name text not null, date text not null,
  fee_pence int not null default 0, status text not null default 'scheduled',
  bookings jsonb not null default '[]'::jsonb
);

create table messages (
  id text primary key, school_id text not null,
  family_id text, lead_id text, channel text not null, direction text not null,
  subject text, body text not null, automation text,
  cost_pence int not null default 0, status text not null,
  scheduled_for text, fail_reason text, created_at text
);
create index on messages (school_id, family_id, created_at);

create table tasks (
  id text primary key, school_id text not null,
  title text not null, due text, related_type text, related_id text,
  status text not null default 'open', created_by text not null default 'user',
  created_at text
);

create table events (
  id text primary key, school_id text not null,
  type text not null, payload jsonb not null default '{}'::jsonb, at text
);
create index on events (school_id, at);

create table templates (
  id text primary key, school_id text, name text not null, body text not null
);

create table posts (
  id text primary key, school_id text not null,
  channels jsonb not null default '[]'::jsonb, body text not null,
  status text not null default 'draft', scheduled_for text,
  source text not null default 'manual', event_type text, event_at text,
  created_at text
);

create table campaigns (
  id text primary key, school_id text not null,
  name text not null, subject text, body text,
  segment jsonb not null default '{}'::jsonb,
  status text not null default 'sent', sent_at text, recipients int
);

create table reviews (
  id text primary key, school_id text not null,
  author text, rating int, text text, date text,
  source text not null default 'google', responded boolean not null default false
);

create table referrals (
  id text primary key, school_id text not null,
  referrer_family_id text not null, lead_id text not null,
  status text not null default 'pending', reward_pence int not null default 0,
  rewarded_at text, created_at text
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table schools enable row level security;

-- Onboarding: any authenticated user may create a school...
create policy schools_insert on schools
  for insert to authenticated with check (true);
-- ...but can only see/update the school they belong to.
create policy schools_select on schools
  for select to authenticated using (id = public.user_school_id());
create policy schools_update on schools
  for update to authenticated using (id = public.user_school_id());

alter table staff_users enable row level security;
-- A user may register themselves as staff (onboarding) and see colleagues.
create policy staff_insert on staff_users
  for insert to authenticated with check (auth_id = auth.uid());
create policy staff_select on staff_users
  for select to authenticated
  using (auth_id = auth.uid() or school_id = public.user_school_id());

do $$
declare t text;
begin
  foreach t in array array[
    'programmes','grades','classes','plans','families','students','enrolments',
    'subscriptions','attendance','payments','leads','grading_events','messages',
    'tasks','events','templates','posts','campaigns','reviews','referrals'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy tenant_all on %I for all to authenticated
         using (school_id = public.user_school_id())
         with check (school_id = public.user_school_id())', t);
  end loop;
end $$;
