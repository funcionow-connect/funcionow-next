begin;
create table if not exists public.community_posts (
  post_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'geral',
  texto text not null check (char_length(trim(texto)) between 1 and 2000),
  criado_em timestamptz not null default now()
);
create index if not exists idx_community_posts_empresa on public.community_posts(empresa_id, criado_em desc);
alter table public.community_posts enable row level security;
drop policy if exists "community_posts_access" on public.community_posts;
create policy "community_posts_access" on public.community_posts for all to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()) and usuario_id = auth.uid());
grant select, insert, update, delete on public.community_posts to authenticated;
grant all on public.community_posts to service_role;
commit;
