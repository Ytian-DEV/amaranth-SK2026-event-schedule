create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.match_results (
  match_key text primary key,
  winner text not null,
  loser text not null,
  confirmed_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  check (winner <> loser)
);

alter table public.admin_users enable row level security;
alter table public.match_results enable row level security;

create or replace function public.is_results_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create policy "Administrators can identify themselves"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

create policy "Anyone can read confirmed results"
on public.match_results for select to anon, authenticated
using (true);

create policy "Results admins can create results"
on public.match_results for insert to authenticated
with check (public.is_results_admin() and confirmed_by = auth.uid());

create policy "Results admins can update results"
on public.match_results for update to authenticated
using (public.is_results_admin())
with check (public.is_results_admin() and confirmed_by = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger match_results_updated_at
before update on public.match_results
for each row execute function public.set_updated_at();

-- After creating an Auth user in Supabase, make it an admin with:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'admin@example.com';
