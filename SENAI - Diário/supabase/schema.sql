create extension if not exists pgcrypto;

create table if not exists public.turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inicio date,
  data_fim date,
  status text,
  quantidade_aulas integer,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  endereco text,
  email text not null unique,
  senha_hash text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.professores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  nif text not null,
  telefone text not null,
  email_institucional text not null unique,
  senha_hash text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.administradores (
  id uuid primary key default gen_random_uuid(),
  nome text not null default 'Administrador',
  email text unique,
  senha_hash text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  telefone text not null,
  email_institucional text not null unique,
  turma_id uuid references public.turmas(id) on delete set null,
  empresa_id uuid references public.empresas(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.professores_turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.professores(id) on delete cascade,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (professor_id, turma_id)
);

create table if not exists public.presencas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  professor_id uuid references public.professores(id) on delete set null,
  turma_id uuid references public.turmas(id) on delete set null,
  aluno text,
  email text,
  turma text,
  empresa text,
  data date not null default current_date,
  status text not null check (status in ('presente', 'falta', 'pendente')),
  aula_numero integer,
  total_aulas_dia integer,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aluno_id, data)
);

alter table public.turmas enable row level security;
alter table public.empresas enable row level security;
alter table public.professores enable row level security;
alter table public.administradores enable row level security;
alter table public.alunos enable row level security;
alter table public.professores_turmas enable row level security;
alter table public.presencas enable row level security;

drop policy if exists "turmas_select" on public.turmas;
drop policy if exists "turmas_insert" on public.turmas;
drop policy if exists "turmas_update" on public.turmas;
drop policy if exists "turmas_delete" on public.turmas;

create policy "turmas_select" on public.turmas for select to anon using (true);
create policy "turmas_insert" on public.turmas for insert to anon with check (true);
create policy "turmas_update" on public.turmas for update to anon using (true) with check (true);
create policy "turmas_delete" on public.turmas for delete to anon using (true);

drop policy if exists "empresas_select" on public.empresas;
drop policy if exists "empresas_insert" on public.empresas;
drop policy if exists "empresas_update" on public.empresas;
drop policy if exists "empresas_delete" on public.empresas;

create policy "empresas_select" on public.empresas for select to anon using (true);
create policy "empresas_insert" on public.empresas for insert to anon with check (true);
create policy "empresas_update" on public.empresas for update to anon using (true) with check (true);
create policy "empresas_delete" on public.empresas for delete to anon using (true);

drop policy if exists "professores_select" on public.professores;
drop policy if exists "professores_insert" on public.professores;
drop policy if exists "professores_update" on public.professores;
drop policy if exists "professores_delete" on public.professores;

create policy "professores_select" on public.professores for select to anon using (true);
create policy "professores_insert" on public.professores for insert to anon with check (true);
create policy "professores_update" on public.professores for update to anon using (true) with check (true);
create policy "professores_delete" on public.professores for delete to anon using (true);

drop policy if exists "administradores_select" on public.administradores;
drop policy if exists "administradores_insert" on public.administradores;
drop policy if exists "administradores_update" on public.administradores;
drop policy if exists "administradores_delete" on public.administradores;

create policy "administradores_select" on public.administradores for select to anon using (true);
create policy "administradores_insert" on public.administradores for insert to anon with check (true);
create policy "administradores_update" on public.administradores for update to anon using (true) with check (true);
create policy "administradores_delete" on public.administradores for delete to anon using (true);

drop policy if exists "alunos_select" on public.alunos;
drop policy if exists "alunos_insert" on public.alunos;
drop policy if exists "alunos_update" on public.alunos;
drop policy if exists "alunos_delete" on public.alunos;

create policy "alunos_select" on public.alunos for select to anon using (true);
create policy "alunos_insert" on public.alunos for insert to anon with check (true);
create policy "alunos_update" on public.alunos for update to anon using (true) with check (true);
create policy "alunos_delete" on public.alunos for delete to anon using (true);

drop policy if exists "professores_turmas_select" on public.professores_turmas;
drop policy if exists "professores_turmas_insert" on public.professores_turmas;
drop policy if exists "professores_turmas_update" on public.professores_turmas;
drop policy if exists "professores_turmas_delete" on public.professores_turmas;

create policy "professores_turmas_select" on public.professores_turmas for select to anon using (true);
create policy "professores_turmas_insert" on public.professores_turmas for insert to anon with check (true);
create policy "professores_turmas_update" on public.professores_turmas for update to anon using (true) with check (true);
create policy "professores_turmas_delete" on public.professores_turmas for delete to anon using (true);

drop policy if exists "presencas_select" on public.presencas;
drop policy if exists "presencas_insert" on public.presencas;
drop policy if exists "presencas_update" on public.presencas;
drop policy if exists "presencas_delete" on public.presencas;

create policy "presencas_select" on public.presencas for select to anon using (true);
create policy "presencas_insert" on public.presencas for insert to anon with check (true);
create policy "presencas_update" on public.presencas for update to anon using (true) with check (true);
create policy "presencas_delete" on public.presencas for delete to anon using (true);
