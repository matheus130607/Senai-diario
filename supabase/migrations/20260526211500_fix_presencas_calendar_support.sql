-- Corrige a estrutura usada pelo calendario e pelo historico de chamadas.
-- A aplicacao tolera bancos antigos, mas estas colunas habilitam os detalhes
-- completos dos eventos exibidos a partir de public.presencas.data.

alter table public.presencas add column if not exists atraso boolean not null default false;
alter table public.presencas add column if not exists justificativa text;
alter table public.presencas add column if not exists termo text;
alter table public.presencas add column if not exists periodo text;

create index if not exists idx_presencas_data on public.presencas (data);
create index if not exists idx_presencas_turma_data on public.presencas (turma_id, data);
create index if not exists idx_presencas_professor_data on public.presencas (professor_id, data);
