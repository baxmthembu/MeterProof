-- MeterProof schema. Paste the whole file into the Supabase SQL Editor and run it once.
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  address text not null default '',
  shield_active_until timestamptz,
  created_at timestamptz not null default now()
);

-- A profile row is created for every new sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- meters
create table if not exists public.meters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  municipality text not null check (municipality in ('joburg', 'ethekwini', 'tshwane', 'capetown')),
  account_number text not null,
  meter_number text not null,
  utility text not null check (utility in ('electricity_postpaid', 'electricity_prepaid', 'water')),
  created_at timestamptz not null default now()
);
create index if not exists meters_user_idx on public.meters (user_id);

-- ---------------------------------------------------------------- readings
-- logged_at comes from the database clock, never from the phone, so it is credible evidence.
create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meter_id uuid not null references public.meters (id) on delete cascade,
  value numeric(12, 2) not null check (value >= 0),
  note text not null default '',
  photo_path text,
  logged_at timestamptz not null default now()
);
create index if not exists readings_meter_idx on public.readings (meter_id, logged_at desc);

-- Even a crafted request cannot back-date a reading.
create or replace function public.stamp_reading()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.logged_at := now();
  return new;
end;
$$;

drop trigger if exists readings_stamp on public.readings;
create trigger readings_stamp before insert on public.readings
  for each row execute function public.stamp_reading();

-- ---------------------------------------------------------------- disputes
-- One row carries the whole case: the statement, the maths, then the follow-up tracker.
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meter_id uuid not null references public.meters (id) on delete cascade,
  statement_date date not null,
  billing_days integer not null check (billing_days between 1 and 366),
  billed_previous numeric(12, 2) not null,
  billed_current numeric(12, 2) not null,
  is_estimate boolean not null default false,
  evidence_reading_id uuid not null references public.readings (id),
  billed_units numeric(12, 2) not null,
  actual_units numeric(12, 2) not null,
  overbilled_units numeric(12, 2) not null,
  billed_rand numeric(12, 2) not null,
  actual_rand numeric(12, 2) not null,
  overcharge_rand numeric(12, 2) not null,
  safe_payment_rand numeric(12, 2) not null,
  reference_number text not null default '',
  submitted_on date,
  channel text check (channel in ('Email', 'Walk-in Centre', 'Municipal Portal', 'Call Centre')),
  status text not null default 'Logged'
    check (status in ('Logged', 'Awaiting Site Inspection', 'Escalated', 'Resolved & Credited')),
  created_at timestamptz not null default now()
);
create index if not exists disputes_user_idx on public.disputes (user_id, created_at desc);

-- ---------------------------------------------------------------- payments
-- Written only by the server (service-role key) from the PayFast ITN route.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dispute_id uuid references public.disputes (id) on delete set null,
  product text not null check (product in ('dispute_pack', 'account_shield')),
  amount numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'complete')),
  pf_payment_id text unique,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id);

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.meters   enable row level security;
alter table public.readings enable row level security;
alter table public.disputes enable row level security;
alter table public.payments enable row level security;

-- profiles: read your own; edit only name and address (never shield_active_until).
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
revoke update on public.profiles from authenticated;
grant update (full_name, address) on public.profiles to authenticated;

-- meters: full control of your own.
drop policy if exists "meters own" on public.meters;
create policy "meters own" on public.meters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- readings: append-only evidence. Read and insert your own; no update, no delete.
drop policy if exists "readings read own" on public.readings;
create policy "readings read own" on public.readings for select using (auth.uid() = user_id);
drop policy if exists "readings insert own" on public.readings;
create policy "readings insert own" on public.readings for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.meters m where m.id = meter_id and m.user_id = auth.uid())
);

-- disputes: full control of your own.
drop policy if exists "disputes own" on public.disputes;
create policy "disputes own" on public.disputes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- payments: read your own. No insert/update/delete policy, so only the service role can write.
drop policy if exists "payments read own" on public.payments;
create policy "payments read own" on public.payments for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------- storage: meter photos
insert into storage.buckets (id, name, public) values ('meter-photos', 'meter-photos', false)
on conflict (id) do nothing;

-- Files live at {user_id}/{meter_id}/{file}.jpg; each user sees only their own folder.
drop policy if exists "meter photos read own" on storage.objects;
create policy "meter photos read own" on storage.objects for select to authenticated
  using (bucket_id = 'meter-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "meter photos insert own" on storage.objects;
create policy "meter photos insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'meter-photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- Needed when a user deletes a meter or their account.
drop policy if exists "meter photos delete own" on storage.objects;
create policy "meter photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'meter-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- security hardening
-- Photos: JPEG only, 5 MB at most (the app shrinks every photo to a small JPEG before upload).
update storage.buckets
   set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg']
 where id = 'meter-photos';

-- Length limits, enforced by the database whatever the browser sends.
alter table public.profiles drop constraint if exists profiles_lengths;
alter table public.profiles add constraint profiles_lengths
  check (char_length(full_name) <= 120 and char_length(address) <= 500);

alter table public.meters drop constraint if exists meters_lengths;
alter table public.meters add constraint meters_lengths
  check (char_length(account_number) between 1 and 40 and char_length(meter_number) between 1 and 40);

alter table public.readings drop constraint if exists readings_lengths;
alter table public.readings add constraint readings_lengths
  check (char_length(note) <= 140 and (photo_path is null or char_length(photo_path) <= 200));

alter table public.disputes drop constraint if exists disputes_lengths;
alter table public.disputes add constraint disputes_lengths
  check (char_length(reference_number) <= 60);

-- A reading's photo must sit in the owner's own folder.
alter table public.readings drop constraint if exists readings_photo_owner;
alter table public.readings add constraint readings_photo_owner
  check (photo_path is null or photo_path like user_id::text || '/%');

-- Rate limiting for the API routes. Only the server (service role) can use it.
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);
alter table public.rate_limits enable row level security; -- no policies: invisible to users

create or replace function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning r.count into v_count;
  return v_count <= p_max;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
