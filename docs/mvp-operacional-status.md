# MVP Operacional — status de implementação

Data: 2026-06-06

## Objetivo

Criar o primeiro núcleo operacional da Funcionow Connect para gestão interna de empresas/marcas, usando a operação Burble Fresh como cliente piloto.

## Banco de dados aplicado no Supabase

Foram criadas as tabelas:

- `projetos`
- `tarefas`
- `reunioes`
- `reuniao_participantes`
- `notas`
- `eventos_calendario`

Também foram cadastradas as páginas no controle de permissões:

- `operacao_dashboard` -> `/operacao`
- `operacao_projetos` -> `/operacao/projetos`
- `operacao_tarefas` -> `/operacao/tarefas`
- `operacao_calendario` -> `/operacao/calendario`
- `operacao_reunioes` -> `/operacao/reunioes`
- `operacao_notas` -> `/operacao/notas`

Permissões liberadas para perfis administrativos.

## Funcionalidades implementadas/testadas localmente

### Dashboard Operacional

Rota: `/operacao`

Mostra:

- projetos ativos;
- tarefas abertas;
- tarefas atrasadas;
- próximas reuniões;
- atalhos rápidos;
- projetos recentes;
- tarefas abertas;
- reuniões futuras;
- notas recentes.

### Projetos

Rota: `/operacao/projetos`

Permite:

- listar projetos da empresa logada;
- criar projeto;
- definir status;
- definir prioridade;
- definir data de início;
- definir prazo;
- alterar status;
- filtrar por busca e status.

### Tarefas

Rota: `/operacao/tarefas`

Permite:

- listar tarefas da empresa logada;
- criar tarefa;
- vincular tarefa a projeto;
- vincular tarefa a membro da equipe via `responsavel_membro_id`;
- definir status;
- definir prioridade;
- definir prazo;
- mover tarefa entre status;
- visualizar projeto e responsável no card;
- proteger título contra textos muito longos/código colado acidentalmente.

A tabela `tarefas` recebeu:

```sql
alter table public.tarefas
add column if not exists responsavel_membro_id uuid
references public.membros_equipe(membro_id)
on delete set null;

create index if not exists idx_tarefas_responsavel_membro_id
on public.tarefas (responsavel_membro_id);
```

### Reuniões / Calls

Rota: `/operacao/reunioes`

Permite:

- listar reuniões da empresa logada;
- criar reunião;
- vincular reunião a projeto;
- definir tipo;
- definir data/hora de início e fim;
- registrar link da reunião;
- registrar pauta;
- registrar resumo;
- registrar decisões;
- registrar próximos passos;
- registrar transcrição;
- gerar tarefas a partir dos próximos passos da reunião.

## Ajustes realizados durante teste

- Corrigida divergência de `empresa_id` entre projeto Burble Fresh e membros da equipe.
- Membros de equipe foram movidos para a empresa correta para aparecerem no select de responsável.
- Layout da tela de reuniões ajustado para formulário em largura total e lista abaixo.

## Próximos passos

1. Commitar/validar arquivos das páginas operacionais no repositório.
2. Criar tela `/operacao/calendario`.
3. Criar tela `/operacao/notas`.
4. Melhorar geração de tarefas da reunião com revisão antes de salvar:
   - título;
   - responsável;
   - prazo;
   - prioridade.
5. Criar edição de tarefas e reuniões.
6. Criar menu operacional integrado ao layout principal.
