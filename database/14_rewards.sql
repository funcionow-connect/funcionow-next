begin;
create table if not exists public.reward_events (
  event_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('badge', 'meta', 'premio')),
  codigo text not null,
  descricao text,
  criado_em timestamptz not null default now()
);
create index if not exists idx_reward_events_usuario on public.reward_events(usuario_id, criado_em desc);
alter table public.reward_events enable row level security;
drop policy if exists "reward_events_access" on public.reward_events;
create policy "reward_events_access" on public.reward_events for all to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()) and usuario_id = auth.uid());
grant select, insert on public.reward_events to authenticated;
grant all on public.reward_events to service_role;
commit;
