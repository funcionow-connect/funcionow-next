-- Estrutura da Academy para trilhas, aulas e progresso individual.

begin;

create table if not exists public.academy_trilhas (
  trilha_id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(empresa_id) on delete cascade,
  titulo text not null,
  descricao text,
  nivel text not null default 'iniciante' check (nivel in ('iniciante', 'intermediario', 'avancado')),
  categoria text not null default 'geral',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.academy_aulas (
  aula_id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references public.academy_trilhas(trilha_id) on delete cascade,
  titulo text not null,
  descricao text,
  conteudo text,
  ordem integer not null default 1 check (ordem > 0),
  duracao_min integer not null default 0 check (duracao_min >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (trilha_id, ordem)
);

create table if not exists public.academy_progresso (
  progresso_id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.academy_aulas(aula_id) on delete cascade,
  concluida_em timestamptz not null default now(),
  unique (usuario_id, aula_id)
);

create index if not exists idx_academy_trilhas_empresa on public.academy_trilhas(empresa_id, ativo);
create index if not exists idx_academy_aulas_trilha on public.academy_aulas(trilha_id, ordem);
create index if not exists idx_academy_progresso_usuario on public.academy_progresso(usuario_id);

alter table public.academy_trilhas enable row level security;
alter table public.academy_aulas enable row level security;
alter table public.academy_progresso enable row level security;

drop policy if exists "academy_trilhas_select" on public.academy_trilhas;
create policy "academy_trilhas_select" on public.academy_trilhas for select to authenticated
using (empresa_id is null or empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "academy_aulas_select" on public.academy_aulas;
create policy "academy_aulas_select" on public.academy_aulas for select to authenticated
using (exists (select 1 from public.academy_trilhas t where t.trilha_id = academy_aulas.trilha_id and (t.empresa_id is null or t.empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))));

drop policy if exists "academy_progresso_own" on public.academy_progresso;
create policy "academy_progresso_own" on public.academy_progresso for all to authenticated
using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "academy_trilhas_manage" on public.academy_trilhas;
create policy "academy_trilhas_manage" on public.academy_trilhas for all to authenticated
using (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = academy_trilhas.empresa_id and u.perfil in ('admin', 'suporte')))
with check (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = academy_trilhas.empresa_id and u.perfil in ('admin', 'suporte')));

drop policy if exists "academy_aulas_manage" on public.academy_aulas;
create policy "academy_aulas_manage" on public.academy_aulas for all to authenticated
using (exists (select 1 from public.academy_trilhas t join public.usuarios u on u.empresa_id = t.empresa_id where t.trilha_id = academy_aulas.trilha_id and u.usuario_id = auth.uid() and u.perfil in ('admin', 'suporte')))
with check (exists (select 1 from public.academy_trilhas t join public.usuarios u on u.empresa_id = t.empresa_id where t.trilha_id = academy_aulas.trilha_id and u.usuario_id = auth.uid() and u.perfil in ('admin', 'suporte')));

grant select on public.academy_trilhas, public.academy_aulas to authenticated;
grant select, insert, update, delete on public.academy_progresso to authenticated;
grant select on public.academy_trilhas, public.academy_aulas, public.academy_progresso to anon;
grant all on public.academy_trilhas, public.academy_aulas, public.academy_progresso to service_role;

commit;
