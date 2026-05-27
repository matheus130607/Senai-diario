-- Prepara o banco para piloto com Supabase Auth, perfis separados,
-- auditoria e politicas RLS por papel.

create extension if not exists pgcrypto;

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
  client_id text unique,
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
  client_id text unique,
  automation_id uuid references public.email_automations(id) on delete set null,
  automation_client_id text,
  automation_name text,
  status text not null default 'queued',
  recipients integer not null default 0,
  attempts integer not null default 1,
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tic_access_logs (
  id uuid primary key default gen_random_uuid(),
  email text,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.administradores add column if not exists perfil text not null default 'coordenacao';
update public.administradores set perfil = 'coordenacao' where perfil is null or perfil = '';

do $$
begin
  if exists (select 1 from public.administradores where lower(email) = 'secretaria@senaisp.edu.br') then
    update public.administradores
    set nome = coalesce(nullif(nome, ''), 'Secretaria Acadêmica'),
        senha_hash = coalesce(nullif(senha_hash, ''), 'senha_teste_123'),
        perfil = 'secretaria',
        updated_at = now()
    where lower(email) = 'secretaria@senaisp.edu.br';
  else
    insert into public.administradores (nome, email, senha_hash, perfil)
    values ('Secretaria Acadêmica', 'secretaria@senaisp.edu.br', 'senha_teste_123', 'secretaria');
  end if;
end $$;

alter table public.email_automations add column if not exists client_id text;
alter table public.email_automation_logs add column if not exists client_id text;
create unique index if not exists idx_email_automations_client_id on public.email_automations (client_id) where client_id is not null;
create unique index if not exists idx_email_automation_logs_client_id on public.email_automation_logs (client_id) where client_id is not null;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  role text not null check (role in ('coordenacao', 'secretaria', 'professor', 'empresa', 'tic')),
  nome text not null,
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  related_professor_id uuid references public.professores(id) on delete set null,
  related_empresa_id uuid references public.empresas(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.user_profiles(id) on delete set null,
  actor_role text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.email_automations enable row level security;
alter table public.email_automation_logs enable row level security;
alter table public.tic_access_logs enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where auth_user_id = auth.uid() and status = 'active' limit 1
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.user_profiles where auth_user_id = auth.uid() and status = 'active' limit 1
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

drop policy if exists "turmas_select" on public.turmas;
drop policy if exists "turmas_insert" on public.turmas;
drop policy if exists "turmas_update" on public.turmas;
drop policy if exists "turmas_delete" on public.turmas;
create policy "turmas_select" on public.turmas for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic') or exists (select 1 from public.professores p join public.professores_turmas pt on pt.professor_id = p.id where pt.turma_id = turmas.id and lower(p.email_institucional) = public.current_user_email()) or exists (select 1 from public.empresas e join public.alunos a on a.empresa_id = e.id where a.turma_id = turmas.id and lower(e.email) = public.current_user_email()));
create policy "turmas_insert" on public.turmas for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "turmas_update" on public.turmas for update to authenticated using (public.current_app_role() in ('secretaria', 'tic')) with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "turmas_delete" on public.turmas for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "alunos_select" on public.alunos;
drop policy if exists "alunos_insert" on public.alunos;
drop policy if exists "alunos_update" on public.alunos;
drop policy if exists "alunos_delete" on public.alunos;
create policy "alunos_select" on public.alunos for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic') or exists (select 1 from public.professores p join public.professores_turmas pt on pt.professor_id = p.id where pt.turma_id = alunos.turma_id and lower(p.email_institucional) = public.current_user_email()) or exists (select 1 from public.empresas e where e.id = alunos.empresa_id and lower(e.email) = public.current_user_email()));
create policy "alunos_insert" on public.alunos for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "alunos_update" on public.alunos for update to authenticated using (public.current_app_role() in ('secretaria', 'tic')) with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "alunos_delete" on public.alunos for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "professores_select" on public.professores;
drop policy if exists "professores_insert" on public.professores;
drop policy if exists "professores_update" on public.professores;
drop policy if exists "professores_delete" on public.professores;
create policy "professores_select" on public.professores for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic') or lower(email_institucional) = public.current_user_email());
create policy "professores_insert" on public.professores for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "professores_update" on public.professores for update to authenticated using (public.current_app_role() in ('secretaria', 'tic')) with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "professores_delete" on public.professores for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "empresas_select" on public.empresas;
drop policy if exists "empresas_insert" on public.empresas;
drop policy if exists "empresas_update" on public.empresas;
drop policy if exists "empresas_delete" on public.empresas;
create policy "empresas_select" on public.empresas for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic') or lower(email) = public.current_user_email());
create policy "empresas_insert" on public.empresas for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "empresas_update" on public.empresas for update to authenticated using (public.current_app_role() in ('secretaria', 'tic')) with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "empresas_delete" on public.empresas for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "administradores_select" on public.administradores;
drop policy if exists "administradores_insert" on public.administradores;
drop policy if exists "administradores_update" on public.administradores;
drop policy if exists "administradores_delete" on public.administradores;
create policy "administradores_select" on public.administradores for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic') or lower(email) = public.current_user_email());
create policy "administradores_insert" on public.administradores for insert to authenticated with check (public.current_app_role() = 'tic');
create policy "administradores_update" on public.administradores for update to authenticated using (public.current_app_role() = 'tic') with check (public.current_app_role() = 'tic');
create policy "administradores_delete" on public.administradores for delete to authenticated using (public.current_app_role() = 'tic');

drop policy if exists "professores_turmas_select" on public.professores_turmas;
drop policy if exists "professores_turmas_insert" on public.professores_turmas;
drop policy if exists "professores_turmas_update" on public.professores_turmas;
drop policy if exists "professores_turmas_delete" on public.professores_turmas;
create policy "professores_turmas_select" on public.professores_turmas for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic') or exists (select 1 from public.professores p where p.id = professores_turmas.professor_id and lower(p.email_institucional) = public.current_user_email()));
create policy "professores_turmas_insert" on public.professores_turmas for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "professores_turmas_update" on public.professores_turmas for update to authenticated using (public.current_app_role() in ('secretaria', 'tic')) with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "professores_turmas_delete" on public.professores_turmas for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "presencas_select" on public.presencas;
drop policy if exists "presencas_insert" on public.presencas;
drop policy if exists "presencas_update" on public.presencas;
drop policy if exists "presencas_delete" on public.presencas;
create policy "presencas_select" on public.presencas for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic') or exists (select 1 from public.professores p join public.professores_turmas pt on pt.professor_id = p.id where pt.turma_id = presencas.turma_id and lower(p.email_institucional) = public.current_user_email()) or exists (select 1 from public.empresas e join public.alunos a on a.empresa_id = e.id where a.id = presencas.aluno_id and lower(e.email) = public.current_user_email()));
create policy "presencas_insert" on public.presencas for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic') or exists (select 1 from public.professores p join public.professores_turmas pt on pt.professor_id = p.id where pt.turma_id = presencas.turma_id and lower(p.email_institucional) = public.current_user_email()));
create policy "presencas_update" on public.presencas for update to authenticated using (public.current_app_role() in ('secretaria', 'tic') or exists (select 1 from public.professores p join public.professores_turmas pt on pt.professor_id = p.id where pt.turma_id = presencas.turma_id and lower(p.email_institucional) = public.current_user_email())) with check (public.current_app_role() in ('secretaria', 'tic') or exists (select 1 from public.professores p join public.professores_turmas pt on pt.professor_id = p.id where pt.turma_id = presencas.turma_id and lower(p.email_institucional) = public.current_user_email()));
create policy "presencas_delete" on public.presencas for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "user_profiles_select" on public.user_profiles;
drop policy if exists "user_profiles_insert" on public.user_profiles;
drop policy if exists "user_profiles_update" on public.user_profiles;
drop policy if exists "user_profiles_delete" on public.user_profiles;
create policy "user_profiles_select" on public.user_profiles for select to authenticated using (auth_user_id = auth.uid() or public.current_app_role() in ('secretaria', 'tic'));
create policy "user_profiles_insert" on public.user_profiles for insert to authenticated with check (public.current_app_role() = 'tic');
create policy "user_profiles_update" on public.user_profiles for update to authenticated using (auth_user_id = auth.uid() or public.current_app_role() = 'tic') with check (auth_user_id = auth.uid() or public.current_app_role() = 'tic');
create policy "user_profiles_delete" on public.user_profiles for delete to authenticated using (public.current_app_role() = 'tic');

drop policy if exists "user_preferences_select" on public.user_preferences;
drop policy if exists "user_preferences_insert" on public.user_preferences;
drop policy if exists "user_preferences_update" on public.user_preferences;
drop policy if exists "user_preferences_delete" on public.user_preferences;
create policy "user_preferences_select" on public.user_preferences for select to authenticated using (user_id = public.current_profile_id()::text or public.current_app_role() = 'tic');
create policy "user_preferences_insert" on public.user_preferences for insert to authenticated with check (user_id = public.current_profile_id()::text or public.current_app_role() = 'tic');
create policy "user_preferences_update" on public.user_preferences for update to authenticated using (user_id = public.current_profile_id()::text or public.current_app_role() = 'tic') with check (user_id = public.current_profile_id()::text or public.current_app_role() = 'tic');
create policy "user_preferences_delete" on public.user_preferences for delete to authenticated using (public.current_app_role() = 'tic');

drop policy if exists "email_automations_select" on public.email_automations;
drop policy if exists "email_automations_insert" on public.email_automations;
drop policy if exists "email_automations_update" on public.email_automations;
drop policy if exists "email_automations_delete" on public.email_automations;
create policy "email_automations_select" on public.email_automations for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic'));
create policy "email_automations_insert" on public.email_automations for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "email_automations_update" on public.email_automations for update to authenticated using (public.current_app_role() in ('secretaria', 'tic')) with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "email_automations_delete" on public.email_automations for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "email_automation_logs_select" on public.email_automation_logs;
drop policy if exists "email_automation_logs_insert" on public.email_automation_logs;
drop policy if exists "email_automation_logs_update" on public.email_automation_logs;
drop policy if exists "email_automation_logs_delete" on public.email_automation_logs;
create policy "email_automation_logs_select" on public.email_automation_logs for select to authenticated using (public.current_app_role() in ('coordenacao', 'secretaria', 'tic'));
create policy "email_automation_logs_insert" on public.email_automation_logs for insert to authenticated with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "email_automation_logs_update" on public.email_automation_logs for update to authenticated using (public.current_app_role() in ('secretaria', 'tic')) with check (public.current_app_role() in ('secretaria', 'tic'));
create policy "email_automation_logs_delete" on public.email_automation_logs for delete to authenticated using (public.current_app_role() in ('secretaria', 'tic'));

drop policy if exists "tic_access_logs_select" on public.tic_access_logs;
drop policy if exists "tic_access_logs_insert" on public.tic_access_logs;
drop policy if exists "tic_access_logs_update" on public.tic_access_logs;
drop policy if exists "tic_access_logs_delete" on public.tic_access_logs;
create policy "tic_access_logs_select" on public.tic_access_logs for select to authenticated using (public.current_app_role() = 'tic');
create policy "tic_access_logs_insert" on public.tic_access_logs for insert to authenticated with check (true);
create policy "tic_access_logs_update" on public.tic_access_logs for update to authenticated using (public.current_app_role() = 'tic') with check (public.current_app_role() = 'tic');
create policy "tic_access_logs_delete" on public.tic_access_logs for delete to authenticated using (public.current_app_role() = 'tic');

drop policy if exists "audit_logs_select" on public.audit_logs;
drop policy if exists "audit_logs_insert" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs for select to authenticated using (public.current_app_role() in ('coordenacao', 'tic'));
create policy "audit_logs_insert" on public.audit_logs for insert to authenticated with check (true);
