# Supabase database mirror

Esta pasta documenta o estado atual do banco Supabase usado pelo projeto `funcionow-next`.

Ela foi criada como espelho técnico do Supabase atual, com base nas consultas feitas no banco.

## Arquivos

- `00_extensions.sql`: extensões usadas pelo banco.
- `01_schema.sql`: tabelas, colunas, primary keys e checks principais.
- `02_constraints_indexes.sql`: foreign keys e índices.
- `03_functions.sql`: funções públicas do banco.
- `04_views.sql`: views públicas.
- `05_triggers.sql`: triggers ativas.
- `06_rls.sql`: RLS e policies.

## Importante

Estes arquivos representam o estado atual do banco, mas ainda não são uma migração automática testada do zero.

Antes de executar em outro banco, revisar a ordem dos arquivos, dependências, policies e objetos legados.

## Pontos de atenção identificados

- Existem funções antigas/legadas no banco que não possuem triggers ativos atualmente, como `fn_sugerir_proxima_etapa`, `fn_validar_avanco_etapa`, `fn_registrar_auditoria_decisao` e `fn_atualizar_score_total_creator`.
- A tabela `creators` possui dois checks parecidos para `status`: `chk_status_funil` e `creators_status_check`.
- Algumas policies usam `to public`, mas dependem de `auth.uid()`. Funciona como proteção, porém para longo prazo pode ser melhor padronizar para `authenticated`.
- A função principal atual do fluxo de avaliação é `salvar_avaliacao_creator`.
- As únicas triggers ativas identificadas estão em `creator_captacao`.

## Regra de trabalho

Sempre que alterar algo no Supabase manualmente, atualizar também estes arquivos e commitar no GitHub.
