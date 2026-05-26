# SENAI Diario - Design System

## Direcao

Sistema institucional premium para gestao escolar e chamadas. A interface deve parecer limpa, confiavel e tecnologica, sem excesso de efeitos. A referencia principal e a filosofia da Apple HIG: hierarquia clara, foco no conteudo, espacamento consistente, tipografia contida e controles previsiveis.

## Problemas identificados

- Excesso de pesos fortes competindo entre si.
- Muitos cards com mesma importancia visual.
- Formularios, tabelas, listas e botoes com estilos diferentes.
- Layouts muito empilhados, com pouco uso de grid desktop.
- Estados de vazio, carregamento e feedback sem linguagem unica.
- Mistura de tons e bordas que deixava a interface generica.
- Estilos globais de template interferindo na aplicacao.

## Sistema visual

- Background: cinza Apple-like muito claro, com vermelho SENAI apenas como acento.
- Superficies: branco translúcido leve, borda fina e sombra quase inexistente.
- Tipografia: pesos 400-600 por padrao; 700+ apenas para numeros ou marcos muito pontuais.
- Grid: desktop-first, com largura ampla e sidebar fixa.
- Raio: 8px para componentes e paineis.
- Movimento: transicoes discretas de 180ms.
- Iconografia: lucide-react, sempre com tamanho controlado.

## Tokens principais

- `--senai-red`
- `--senai-red-dark`
- `--ink-900`
- `--ink-500`
- `--paper`
- `--paper-soft`
- `--line`
- `--radius`
- `--motion`

## Classes base

- `.workspace-panel`
- `.card`
- `.ds-form`
- `.ds-label`
- `.ds-input`
- `.ds-button`
- `.ds-icon-button`
- `.ds-list-item`
- `.ds-table`
- `.ds-badge`
- `.ds-muted-panel`

## Componentes React

Arquivo: `src/components/ui/DesignSystem.jsx`

- `SectionHeader`
- `Button`
- `IconButton`
- `StatusBadge`
- `EmptyState`
- `AvatarInitial`

## Regras de uso

- Evitar novos estilos inline repetidos quando uma classe `ds-*` ja existir.
- Evitar `font-bold`/`font-extrabold` em blocos densos.
- Usar botao primario apenas para a acao principal da tela ou formulario.
- Usar badges para estado, nao para texto decorativo.
- Tabelas devem priorizar leitura, nao molduras pesadas.
- Nao alterar integracoes ou contratos de dados por causa de UI.
- Nao mexer no background dinamico do login sem decisao explicita.

## Proximos passos

1. Converter todos os formularios restantes para composicoes menores.
2. Criar componente de tabela responsiva reutilizavel.
3. Criar padrao de toolbar por modulo.
4. Revisar microcopy para portugues brasileiro consistente.
5. Validar responsividade com navegador em desktop e mobile.
