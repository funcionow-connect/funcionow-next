-- Participantes das reuniões, vinculados aos membros ativos da empresa.
create table if not exists public.reuniao_participantes (
  participante_id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  reuniao_id uuid not null,
  membro_id uuid not null,
  criado_em timestamp with time zone not null default now(),
  constraint reuniao_participantes_pkey primary key (participante_id),
  constraint reuniao_participantes_reuniao_fkey foreign key (reuniao_id) references public.reunioes(reuniao_id) on delete cascade,
  constraint reuniao_participantes_membro_fkey foreign key (membro_id) references public.membros_equipe(membro_id) on delete cascade,
  constraint reuniao_participantes_empresa_fkey foreign key (empresa_id) references public.empresas(empresa_id) on delete cascade,
  constraint reuniao_participantes_unique unique (reuniao_id, membro_id)
);

create index if not exists idx_reuniao_participantes_reuniao on public.reuniao_participantes(reuniao_id);
create index if not exists idx_reuniao_participantes_empresa on public.reuniao_participantes(empresa_id);

alter table public.reuniao_participantes enable row level security;
drop policy if exists reuniao_participantes_select_empresa on public.reuniao_participantes;
create policy reuniao_participantes_select_empresa on public.reuniao_participantes for select to authenticated using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists reuniao_participantes_insert_empresa on public.reuniao_participantes;
create policy reuniao_participantes_insert_empresa on public.reuniao_participantes for insert to authenticated with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists reuniao_participantes_update_empresa on public.reuniao_participantes;
create policy reuniao_participantes_update_empresa on public.reuniao_participantes for update to authenticated using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid())) with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));
drop policy if exists reuniao_participantes_delete_empresa on public.reuniao_participantes;
create policy reuniao_participantes_delete_empresa on public.reuniao_participantes for delete to authenticated using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

grant select, insert, update, delete on public.reuniao_participantes to authenticated;
grant select, insert, update, delete on public.reuniao_participantes to service_role;
