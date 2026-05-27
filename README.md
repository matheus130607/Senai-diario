# SENAI Diário Digital

Sistema web para registro de presença, acompanhamento de aprendizes, integração escola-empresa, relatórios acadêmicos e comunicados automáticos para unidades SENAI.

## Objetivo

Centralizar a rotina do diário de classe em uma plataforma institucional: professores registram presença, Secretaria mantém cadastros e vínculos, Coordenação acompanha indicadores e empresas parceiras recebem visibilidade sobre seus aprendizes.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React, JavaScript, Vite |
| UI | CSS do design system, Tailwind local, Lucide React, Framer Motion |
| Estado | Context API sincronizada com Supabase |
| Dados | Supabase com schema versionado, migrations e RLS por perfil |
| Autenticação | Supabase Auth com compatibilidade para tabelas legadas do Supabase |
| Relatórios | CSV/PDF no navegador |
| Comunicados | Painel persistente com fila/logs e preparo para backend/Edge Function |

## Perfis

| Perfil | Uso principal | Acessos |
|---|---|---|
| Coordenação | Visão estratégica | Dashboards, indicadores, alertas de frequência, relatórios, calendário e acompanhamento de comunicados |
| Secretaria | Operação administrativa | CRUD de alunos, professores, empresas e turmas, vínculos, relatórios e comunicados |
| Professor | Rotina de sala | Registro de presença, minhas turmas, aprendizes, relatórios e calendário |
| Empresa Parceira | Acompanhamento externo | Aprendizes vinculados, histórico, calendário e relatórios |
| TIC | Administração técnica | Integrações, logs, auditoria, permissões, reset e saúde do sistema |

## Funcionalidades

- Login por perfil com Coordenação e Secretaria separados.
- Rota técnica `/sesisenaisp72` para acesso TIC, sem token padrão ou preenchimento automático.
- Registro de presença por turma e data.
- Histórico por aprendiz com presença, faltas, atrasos, observações e justificativas.
- Dashboards por perfil e alertas para faltas/pedências.
- CRUD administrativo focado na Secretaria.
- Portal da Empresa Parceira com relatórios por período.
- Comunicados automáticos para relatórios semanais a empresas.
- Preferências de acessibilidade e perfil com persistência local e Supabase quando disponível.
- Auditoria preparada para operações sensíveis.

## Supabase

Execute as migrations em ordem ou use `supabase/schema.sql` como snapshot completo.

Principais tabelas:

- `user_profiles`: vínculo entre `auth.users` e o papel da aplicação.
- `turmas`, `alunos`, `professores`, `empresas`, `professores_turmas`.
- `presencas`: registros de chamada e histórico.
- `user_preferences`: perfil, acessibilidade, notificações e logs de acesso.
- `email_automations` e `email_automation_logs`: comunicados automáticos.
- `tic_access_logs` e `audit_logs`: monitoramento e auditoria.

As políticas RLS finais usam `authenticated` e liberam dados por escopo:

- Coordenação lê dados consolidados.
- Secretaria cria e altera cadastros acadêmicos.
- Professor lê/escreve presença apenas das turmas vinculadas.
- Empresa lê apenas aprendizes vinculados.
- TIC administra integrações, logs e auditoria.

## Instalação

```bash
npm install
cp .env.example .env
npm run dev
```

Aplicação local:

```txt
http://127.0.0.1:5173
```

Rota técnica:

```txt
http://127.0.0.1:5173/sesisenaisp72
```

## Variáveis

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_TIC_ACCESS_TOKEN=
```

`VITE_TIC_ACCESS_TOKEN` não possui valor padrão seguro. Configure localmente para testar o acesso TIC.

## Ambiente local

O aplicativo depende do Supabase configurado no `.env.local`. Sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o sistema não carrega usuários reais nem libera autenticação. O painel "Acessos do Supabase" na tela de login lista apenas usuários retornados pelo banco configurado.

## Comunicados automáticos

O fluxo principal previsto é semanal:

1. Toda segunda-feira às 05:00.
2. O sistema consolida a semana anterior.
3. Cada empresa recebe relatório com aprendizes vinculados, presenças, faltas, atrasos e justificativas.
4. Secretaria/TIC acompanham fila, logs, falhas e reenvios.

O frontend já modela painel, templates, logs, retry e persistência. A entrega real de e-mails deve ser feita por backend ou Supabase Edge Function.

## Qualidade

```bash
npm run lint
npm run build
```

Itens prioritários antes de produção:

- Criar usuários em Supabase Auth.
- Preencher `user_profiles`.
- Aplicar migrations com políticas RLS.
- Validar permissões por perfil.
- Configurar provedor real de e-mail.
- Adicionar testes E2E de login, chamada, relatórios e bloqueios por perfil.

## Roadmap

- Justificativa de faltas com validação da Secretaria.
- Alertas automáticos para baixa frequência.
- Painel analítico avançado para Coordenação.
- Edge Function para comunicados semanais.
- Auditoria visual para TIC.
- Testes E2E com Playwright.
- Deploy em Vercel/Netlify com SPA fallback.

## Licença

Projeto proprietário. Consulte `LICENSE`.
