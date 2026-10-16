-- Conteúdo estratégico configurável por empresa.
create table if not exists public.empresa_diretrizes (
  diretriz_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  secao text not null check (secao in ('visao_geral', 'estrategia', 'publico', 'comunicacao')),
  rotulo text not null,
  conteudo text not null,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_por uuid references public.usuarios(usuario_id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists empresa_diretrizes_empresa_secao_idx
  on public.empresa_diretrizes (empresa_id, secao, ordem);

alter table public.empresa_diretrizes enable row level security;

drop policy if exists empresa_diretrizes_select_mesma_empresa on public.empresa_diretrizes;
create policy empresa_diretrizes_select_mesma_empresa
  on public.empresa_diretrizes for select to authenticated
  using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists empresa_diretrizes_insert_mesma_empresa on public.empresa_diretrizes;
create policy empresa_diretrizes_insert_mesma_empresa
  on public.empresa_diretrizes for insert to authenticated
  with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists empresa_diretrizes_update_mesma_empresa on public.empresa_diretrizes;
create policy empresa_diretrizes_update_mesma_empresa
  on public.empresa_diretrizes for update to authenticated
  using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
  with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists empresa_diretrizes_delete_mesma_empresa on public.empresa_diretrizes;
create policy empresa_diretrizes_delete_mesma_empresa
  on public.empresa_diretrizes for delete to authenticated
  using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

grant select, insert, update, delete on public.empresa_diretrizes to authenticated;
grant all on public.empresa_diretrizes to service_role;
