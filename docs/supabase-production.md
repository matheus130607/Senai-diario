# Supabase em producao

Este documento separa o que fica no frontend, no banco/Supabase Auth e nas Edge Functions.

## 1. Migracoes

Aplicar as migrations em ordem:

```bash
npx supabase login
npx supabase link --project-ref ifbzlqkimhygpctholfi
npx supabase db push
```

Se preferir nao abrir login interativo, defina `SUPABASE_ACCESS_TOKEN` antes do `link`.

A migration `20260528102000_auth_profile_linking_and_dashboard_performance.sql` faz a transicao segura:

- `senha_hash` deixa de ser obrigatoria em `administradores`, `professores` e `empresas`.
- `get_current_user_profile()` vincula o usuario logado do Supabase Auth ao registro ativo em `user_profiles`.
- Indices de presencas e vinculos sao criados para dashboards e historico.
- Logs de automacao recebem campos para auditar o comunicado executado.

## 2. Usuarios Auth e user_profiles

Depois das migrations, rode o seed oficial com uma service role key apenas no terminal:

```bash
SUPABASE_SERVICE_ROLE_KEY=... SEED_DEFAULT_PASSWORD=... SEED_TIC_PASSWORD=... npm run seed:supabase-users
```

O script:

- cria ou atualiza usuarios em Supabase Auth;
- confirma e-mails para ambiente controlado;
- recria os registros em `user_profiles`;
- vincula professor e empresa pelos ids reais das tabelas;
- nao grava a service role key no frontend.

## 3. Frontend

Variaveis de frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TIC_ACCESS_TOKEN=
VITE_ALLOW_LEGACY_PASSWORD_LOGIN=false
VITE_SHOW_TEST_CREDENTIALS=false
```

Em producao mantenha:

- `VITE_ALLOW_LEGACY_PASSWORD_LOGIN=false`
- `VITE_SHOW_TEST_CREDENTIALS=false`

Assim, o login fica baseado em Supabase Auth e o painel "Acessos do Supabase" some da tela publica.

## 4. Testes Auth/RLS

Use:

```bash
npm run test:rls
```

O teste cobre login e permissoes dos perfis:

- Coordenacao le indicadores e nao faz CRUD operacional.
- Secretaria faz CRUD operacional.
- Professor nao le administradores e nao cria turmas.
- Empresa nao le professores e nao cria turmas.
- TIC le `user_profiles`.
- Anon nao le `administradores`.

Se os usuarios de teste forem diferentes, configure:

```env
TEST_COORDENACAO_EMAIL=
TEST_COORDENACAO_PASSWORD=
TEST_SECRETARIA_EMAIL=
TEST_SECRETARIA_PASSWORD=
TEST_PROFESSOR_EMAIL=
TEST_PROFESSOR_PASSWORD=
TEST_EMPRESA_EMAIL=
TEST_EMPRESA_PASSWORD=
TEST_TIC_EMAIL=
TEST_TIC_PASSWORD=
```

## 5. Automacoes de e-mail

O frontend edita configuracao, templates e logs. O envio real deve rodar na Edge Function:

```bash
npx supabase functions deploy send-email-automations --no-verify-jwt
npx supabase secrets set EMAIL_AUTOMATION_CRON_TOKEN=...
npx supabase secrets set EMAIL_PROVIDER_WEBHOOK_URL=...
npx supabase secrets set EMAIL_PROVIDER_TOKEN=...
```

`EMAIL_PROVIDER_WEBHOOK_URL` deve apontar para um backend/provedor real de e-mail. Sem esse segredo, a funcao registra falha nos logs em vez de fingir envio.

Agendamento via Supabase Cron:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists vault;

select vault.create_secret('https://ifbzlqkimhygpctholfi.supabase.co', 'project_url');
select vault.create_secret('<EMAIL_AUTOMATION_CRON_TOKEN>', 'email_automation_cron_token');

select cron.schedule(
  'send-email-automations-weekly',
  '0 8 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-email-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'email_automation_cron_token')
    ),
    body := jsonb_build_object('source', 'pg_cron', 'run_at', now())
  );
  $$
);
```

`0 8 * * 1` equivale a segunda-feira 05:00 no horario de Sao Paulo quando o banco usa UTC.

## 6. Checklist antes de liberar

- Rodar `npm run lint`.
- Rodar `npm run build`.
- Rodar `npm run test:rls`.
- Testar login manual em Coordenacao, Secretaria, Professor, Empresa e TIC.
- Testar chamada em uma turma real.
- Testar geracao de relatorio de empresa.
- Confirmar no Dashboard do Supabase se a Edge Function e o Cron registram logs reais.
