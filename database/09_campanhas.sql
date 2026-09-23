-- Funcionow Connect - núcleo de campanhas

begin;

create table if not exists public.campanhas (
  campanha_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  nome text not null,
  descricao text,
  status text not null default 'planejada' check (status in ('planejada', 'ativa', 'finalizada', 'cancelada')),
  data_inicio date,
  data_fim date,
  orcamento numeric(14,2) not null default 0 check (orcamento >= 0),
  receita numeric(14,2) not null default 0 check (receita >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campanha_creators (
  campanha_creator_id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(campanha_id) on delete cascade,
  creator_id uuid not null references public.creators(creator_id) on delete cascade,
  status text not null default 'convidado' check (status in ('convidado', 'aprovado', 'reprovado', 'concluido')),
  criado_em timestamptz not null default now(),
  unique (campanha_id, creator_id)
);

create table if not exists public.campanha_entregaveis (
  entregavel_id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(campanha_id) on delete cascade,
  creator_id uuid references public.creators(creator_id) on delete set null,
  titulo text not null,
  status text not null default 'pendente' check (status in ('pendente', 'em_producao', 'entregue', 'aprovado', 'reprovado')),
  custo numeric(14,2) not null default 0 check (custo >= 0),
  receita numeric(14,2) not null default 0 check (receita >= 0),
  prazo date,
  criado_em timestamptz not null default now()
);

create index if not exists idx_campanhas_empresa_id on public.campanhas(empresa_id);
create index if not exists idx_campanha_creators_campanha_id on public.campanha_creators(campanha_id);
create index if not exists idx_campanha_entregaveis_campanha_id on public.campanha_entregaveis(campanha_id);

-- A Data API não concede mais acesso automaticamente a tabelas novas no
-- schema public. Os grants ficam na mesma migration das tabelas; o RLS
-- continua sendo responsável por limitar as linhas por empresa.
grant select on public.campanhas, public.campanha_creators, public.campanha_entregaveis to anon;
grant select, insert, update, delete on public.campanhas, public.campanha_creators, public.campanha_entregaveis to authenticated;
grant select, insert, update, delete on public.campanhas, public.campanha_creators, public.campanha_entregaveis to service_role;

alter table public.campanhas enable row level security;
alter table public.campanha_creators enable row level security;
alter table public.campanha_entregaveis enable row level security;

drop policy if exists "campanhas_select_empresa" on public.campanhas;
create policy "campanhas_select_empresa" on public.campanhas for select to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists "campanhas_insert_empresa" on public.campanhas;
create policy "campanhas_insert_empresa" on public.campanhas for insert to authenticated
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists "campanhas_update_empresa" on public.campanhas;
create policy "campanhas_update_empresa" on public.campanhas for update to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists "campanhas_delete_empresa" on public.campanhas;
create policy "campanhas_delete_empresa" on public.campanhas for delete to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "campanha_creators_empresa" on public.campanha_creators;
create policy "campanha_creators_empresa" on public.campanha_creators for all to authenticated
using (exists (select 1 from public.campanhas c join public.usuarios u on u.empresa_id = c.empresa_id where c.campanha_id = campanha_creators.campanha_id and u.usuario_id = auth.uid()))
with check (exists (select 1 from public.campanhas c join public.usuarios u on u.empresa_id = c.empresa_id where c.campanha_id = campanha_creators.campanha_id and u.usuario_id = auth.uid()));
drop policy if exists "campanha_entregaveis_empresa" on public.campanha_entregaveis;
create policy "campanha_entregaveis_empresa" on public.campanha_entregaveis for all to authenticated
using (exists (select 1 from public.campanhas c join public.usuarios u on u.empresa_id = c.empresa_id where c.campanha_id = campanha_entregaveis.campanha_id and u.usuario_id = auth.uid()))
with check (exists (select 1 from public.campanhas c join public.usuarios u on u.empresa_id = c.empresa_id where c.campanha_id = campanha_entregaveis.campanha_id and u.usuario_id = auth.uid()));

commit;
