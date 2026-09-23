-- Métricas individuais de creators em campanhas.
-- A migration é incremental para preservar os vínculos já existentes.

begin;

alter table public.campanha_creators
  add column if not exists custo numeric(14,2) not null default 0,
  add column if not exists receita numeric(14,2) not null default 0,
  add column if not exists alcance bigint not null default 0,
  add column if not exists cliques bigint not null default 0,
  add column if not exists conversoes integer not null default 0;

create index if not exists idx_campanha_creators_performance
  on public.campanha_creators(campanha_id, receita desc, custo asc);

grant select, insert, update, delete on public.campanha_creators to authenticated;
grant select on public.campanha_creators to anon;
grant select, insert, update, delete on public.campanha_creators to service_role;

commit;
