-- Run this in your Supabase SQL editor

create table if not exists caregiver_applications (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),

  -- Personal
  full_name             text not null,
  gender                text not null,
  nationality           text not null,
  current_country       text not null,
  whatsapp              text not null,
  email                 text not null,

  -- Qualifications
  caregiving_experience text not null,
  years_experience      smallint not null default 0,
  current_occupation    text,
  education_level       text not null,
  certification         text,

  -- Eligibility
  preferred_destination text not null,
  has_passport          boolean not null default false,
  travel_history        text,
  english_proficiency   text not null,

  -- Consent
  consented             boolean not null default false,

  -- Status (for recruiter use)
  status                text not null default 'new' -- new | reviewed | contacted | placed
);

-- Enable RLS (service role key bypasses this)
alter table caregiver_applications enable row level security;

-- No public read/write — only service role key used server-side
-- (no policies needed for server-side only access)
