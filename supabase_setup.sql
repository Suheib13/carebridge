-- ============================================================
--  CareBridge — Supabase Database Setup
--  Run this in: Supabase Dashboard → SQL Editor → New Query
--  Then click the green "Run" button
-- ============================================================

-- 1. Profiles table (stores health details per user)
create table if not exists profiles (
  id                  uuid primary key references auth.users on delete cascade,
  full_name           text not null default '',
  blood_type          text not null default '',
  allergies           text not null default '',
  conditions          text not null default '',
  medications         text not null default '',
  emergency_contacts  text not null default '',
  updated_at          timestamptz
);

alter table profiles enable row level security;

create policy "Users can manage their own profile"
  on profiles for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);


-- 2. Medications table (stores pill reminders per user)
create table if not exists medications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null,
  dosage      text not null default '',
  time        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table medications enable row level security;

create policy if not exists "Users can manage their own medications"
  on medications for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
