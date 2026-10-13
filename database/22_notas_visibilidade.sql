-- Visibilidade de notas e vínculo opcional com reuniões.
alter table public.notas
  add column if not exists visibilidade text not null default 'somente_eu';

alter table public.notas
  add column if not exists reuniao_id uuid null references public.reunioes(reuniao_id) on delete set null;

-- Notas antigas continuam visíveis para a empresa; notas novas começam privadas.
update public.notas set visibilidade = 'empresa' where visibilidade is null or visibilidade = 'somente_eu';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'notas_visibilidade_check') then
    alter table public.notas add constraint notas_visibilidade_check check (visibilidade in ('somente_eu','empresa','gerencia','selecionados'));
  end if;
end $$;

create table if not exists public.nota_permissoes (
  nota_permissao_id uuid not null default gen_random_uuid(),
  nota_id uuid not null references public.notas(nota_id) on delete cascade,
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  usuario_id uuid not null references public.usuarios(usuario_id) on delete cascade,
  criado_em timestamp with time zone not null default now(),
  constraint nota_permissoes_pkey primary key (nota_permissao_id),
  constraint nota_permissoes_unique unique (nota_id, usuario_id)
);

create index if not exists idx_nota_permissoes_nota on public.nota_permissoes(nota_id);
create index if not exists idx_nota_permissoes_usuario on public.nota_permissoes(usuario_id);

alter table public.nota_permissoes enable row level security;
drop policy if exists nota_permissoes_select_empresa on public.nota_permissoes;
create policy nota_permissoes_select_empresa on public.nota_permissoes for select to authenticated using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists nota_permissoes_insert_empresa on public.nota_permissoes;
create policy nota_permissoes_insert_empresa on public.nota_permissoes for insert to authenticated with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists nota_permissoes_delete_empresa on public.nota_permissoes;
create policy nota_permissoes_delete_empresa on public.nota_permissoes for delete to authenticated using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

grant select, insert, update, delete on public.nota_permissoes to authenticated;
grant select, insert, update, delete on public.nota_permissoes to service_role;

-- Substitui a leitura ampla da empresa por uma regra que respeita a visibilidade escolhida.
drop policy if exists notas_select_mesma_empresa on public.notas;
create policy notas_select_visibilidade on public.notas
for select to authenticated
using (
  empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid())
  and (
    visibilidade = 'empresa'
    or criado_por = auth.uid()
    or (visibilidade = 'gerencia' and exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.perfil in ('admin','suporte')))
    or (visibilidade = 'selecionados' and exists (select 1 from public.nota_permissoes np where np.nota_id = notas.nota_id and np.usuario_id = auth.uid()))
  )
);
