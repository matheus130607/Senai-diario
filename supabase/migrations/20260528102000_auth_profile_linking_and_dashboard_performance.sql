-- Finaliza a transicao para Supabase Auth sem quebrar dados legados.
-- Senhas em tabelas publicas deixam de ser obrigatorias e o vinculo Auth
-- passa a ser feito por user_profiles.

alter table public.empresas alter column senha_hash drop not null;
alter table public.professores alter column senha_hash drop not null;
alter table public.administradores alter column senha_hash drop not null;

alter table public.email_automation_logs add column if not exists automation_client_id text;
alter table public.email_automation_logs add column if not exists automation_name text;
alter table public.email_automation_logs add column if not exists created_at timestamptz not null default now();

create index if not exists idx_presencas_aluno_data on public.presencas (aluno_id, data);
create index if not exists idx_presencas_data on public.presencas (data);
create index if not exists idx_presencas_turma_data on public.presencas (turma_id, data);
create index if not exists idx_presencas_professor_data on public.presencas (professor_id, data);
create index if not exists idx_alunos_empresa_id on public.alunos (empresa_id);
create index if not exists idx_alunos_turma_id on public.alunos (turma_id);
create index if not exists idx_user_profiles_lower_email on public.user_profiles (lower(email));

create or replace function public.get_current_user_profile()
returns public.user_profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile public.user_profiles;
  current_uid uuid := auth.uid();
  jwt_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if current_uid is null then
    return null;
  end if;

  select *
  into profile
  from public.user_profiles
  where auth_user_id = current_uid
    and status = 'active'
  limit 1;

  if profile.id is not null then
    return profile;
  end if;

  if jwt_email = '' then
    return null;
  end if;

  update public.user_profiles
  set auth_user_id = current_uid,
      updated_at = now()
  where id = (
    select id
    from public.user_profiles
    where auth_user_id is null
      and lower(email) = jwt_email
      and status = 'active'
    order by created_at asc
    limit 1
  )
  returning * into profile;

  return profile;
end;
$$;

grant execute on function public.get_current_user_profile() to authenticated;
