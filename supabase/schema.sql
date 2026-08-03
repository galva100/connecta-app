-- Run this in the Supabase SQL editor before connecting a production app.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  birth_date date,
  bio text default '',
  city text,
  avatar_url text,
  interests text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sender_id, recipient_id)
);

alter table public.profiles enable row level security;
alter table public.likes enable row level security;

create policy "Profiles are visible to signed-in users" on public.profiles for select to authenticated using (true);
create policy "Users manage their own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage their own likes" on public.likes for all to authenticated using (auth.uid() = sender_id) with check (auth.uid() = sender_id);
