create table if not exists public.app_data (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

drop policy if exists "app_data_select" on public.app_data;
drop policy if exists "app_data_insert" on public.app_data;
drop policy if exists "app_data_update" on public.app_data;

create policy "app_data_select"
on public.app_data
for select
to anon
using (true);

create policy "app_data_insert"
on public.app_data
for insert
to anon
with check (true);

create policy "app_data_update"
on public.app_data
for update
to anon
using (true)
with check (true);

insert into public.app_data (id, payload)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;
