# somativa-diario

Aplicacao front-end em React + Vite para gestao de turmas, professores, empresas parceiras, alunos e chamadas.

## Como rodar

```bash
npm install
npm run dev
```

## Supabase

1. Crie um arquivo `.env` a partir de `.env.example`.
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os dados do projeto Supabase.
3. Execute o SQL de `supabase/schema.sql` no editor SQL do Supabase.
4. Opcionalmente, habilite Realtime para a tabela `app_data` no painel do Supabase para sincronizacao entre abas/clientes.

O app grava o estado principal em `app_data.payload`, mantendo o mesmo formato usado pela interface:

- `turmas`
- `professores`
- `empresas`
- `alunos`
- `config`

## Build

```bash
npm run build
```

## Estrutura importante

- `index.html` - entrada HTML
- `src/` - codigo fonte React
- `src/services/supabaseClient.js` - cliente Supabase
- `src/services/supabaseDataService.js` - leitura, gravacao e assinatura dos dados
- `supabase/schema.sql` - tabela e politicas usadas pelo app
- `public/` - ativos publicos
