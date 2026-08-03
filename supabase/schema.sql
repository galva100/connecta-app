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

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  user_one_id uuid not null references public.profiles(id) on delete cascade,
  user_two_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint different_match_users check (user_one_id <> user_two_id),
  unique (user_one_id, user_two_id)
);

-- Each account receives a private starter profile. The client later completes it
-- through the editable profile form.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Nuevo usuario'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- A reciprocal like creates one canonical match, regardless of who liked first.
create or replace function public.create_match_for_reciprocal_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.likes
    where sender_id = new.recipient_id and recipient_id = new.sender_id
  ) then
    insert into public.matches (user_one_id, user_two_id)
    values (least(new.sender_id, new.recipient_id), greatest(new.sender_id, new.recipient_id))
    on conflict (user_one_id, user_two_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row execute procedure public.create_match_for_reciprocal_like();

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;

create policy "Profiles are visible to signed-in users" on public.profiles for select to authenticated using (true);
create policy "Users manage their own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage their own likes" on public.likes for all to authenticated using (auth.uid() = sender_id) with check (auth.uid() = sender_id);
create policy "Users view their own matches" on public.matches for select to authenticated using (auth.uid() = user_one_id or auth.uid() = user_two_id);
