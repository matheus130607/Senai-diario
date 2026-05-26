-- Extensoes para os modulos de calendario, historico, acessibilidade,
-- automacoes de email e auditoria TIC do SENAI Diario Digital.
--
-- Esta migration e idempotente e foi preparada para aplicacao manual no
-- Supabase, porque o MCP atual esta configurado como read_only=true.

create extension if not exists pgcrypto;

alter table public.presencas add column if not exists atraso boolean not null default false;
alter table public.presencas add column if not exists justificativa text;
alter table public.presencas add column if not exists termo text;
alter table public.presencas add column if not exists periodo text;

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_role text not null,
  profile jsonb not null default '{}'::jsonb,
  accessibility jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  access_logs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, user_role)
);

create table if not exists public.email_automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active',
  periodicity text not null,
  recipients text not null,
  template text not null,
  subject text not null,
  retry_limit integer not null default 3,
  queue text not null default 'attendance-email-reports',
  next_run_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.email_automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references public.email_automations(id) on delete set null,
  status text not null,
  recipients integer not null default 0,
  attempts integer not null default 1,
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.tic_access_logs (
  id uuid primary key default gen_random_uuid(),
  email text,
  event text not null,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
alter table public.email_automations enable row level security;
alter table public.email_automation_logs enable row level security;
alter table public.tic_access_logs enable row level security;

create index if not exists idx_alunos_empresa_id on public.alunos (empresa_id);
create index if not exists idx_alunos_turma_id on public.alunos (turma_id);
create index if not exists idx_presencas_professor_id on public.presencas (professor_id);
create index if not exists idx_presencas_turma_id on public.presencas (turma_id);
create index if not exists idx_presencas_aluno_data on public.presencas (aluno_id, data);
create index if not exists idx_professores_turmas_turma_id on public.professores_turmas (turma_id);

drop policy if exists "user_preferences_select" on public.user_preferences;
drop policy if exists "user_preferences_insert" on public.user_preferences;
drop policy if exists "user_preferences_update" on public.user_preferences;
drop policy if exists "email_automations_select" on public.email_automations;
drop policy if exists "email_automations_insert" on public.email_automations;
drop policy if exists "email_automations_update" on public.email_automations;
drop policy if exists "email_automation_logs_select" on public.email_automation_logs;
drop policy if exists "email_automation_logs_insert" on public.email_automation_logs;
drop policy if exists "tic_access_logs_select" on public.tic_access_logs;
drop policy if exists "tic_access_logs_insert" on public.tic_access_logs;

create policy "user_preferences_select" on public.user_preferences for select to anon using (true);
create policy "user_preferences_insert" on public.user_preferences for insert to anon with check (true);
create policy "user_preferences_update" on public.user_preferences for update to anon using (true) with check (true);

create policy "email_automations_select" on public.email_automations for select to anon using (true);
create policy "email_automations_insert" on public.email_automations for insert to anon with check (true);
create policy "email_automations_update" on public.email_automations for update to anon using (true) with check (true);

create policy "email_automation_logs_select" on public.email_automation_logs for select to anon using (true);
create policy "email_automation_logs_insert" on public.email_automation_logs for insert to anon with check (true);

create policy "tic_access_logs_select" on public.tic_access_logs for select to anon using (true);
create policy "tic_access_logs_insert" on public.tic_access_logs for insert to anon with check (true);

