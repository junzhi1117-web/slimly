-- Slimly Supabase Schema
-- 在 Supabase Dashboard > SQL Editor 執行這個檔案

-- ── profiles ──────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  medication_type text not null default 'mounjaro',
  current_dose numeric not null default 2.5,
  injection_day integer,          -- 0=Sun..6=Sat
  start_date date not null,
  start_weight numeric not null,
  target_weight numeric,
  height numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can manage own profile"
  on profiles for all using (auth.uid() = id);

-- ── dose_records ──────────────────────────────────────────
create table if not exists dose_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  medication text not null,
  dose numeric not null,
  route text not null default 'injection',
  injection_site text,
  with_meal boolean,
  notes text,
  side_effects jsonb default '[]',
  created_at timestamptz default now()
);

alter table dose_records enable row level security;
create policy "Users can manage own dose_records"
  on dose_records for all using (auth.uid() = user_id);

create index dose_records_user_date on dose_records(user_id, date desc);

-- ── weight_logs ───────────────────────────────────────────
create table if not exists weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  weight numeric not null,
  waist numeric,
  created_at timestamptz default now()
);

alter table weight_logs enable row level security;
create policy "Users can manage own weight_logs"
  on weight_logs for all using (auth.uid() = user_id);

create index weight_logs_user_date on weight_logs(user_id, date desc);

-- ── auto-create profile on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, start_date, start_weight)
  values (new.id, current_date, 80)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
