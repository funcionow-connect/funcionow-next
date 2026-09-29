-- Rede de speakers e creators: vínculo e regras de comissão.
begin;

create table if not exists public.speakers (
  speaker_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  nome text not null,
  email text,
  instagram text,
  especialidade text,
  percentual_comissao numeric(5,2) not null default 0 check (percentual_comissao >= 0 and percentual_comissao <= 100),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.speaker_creators (
  speaker_creator_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  speaker_id uuid not null references public.speakers(speaker_id) on delete cascade,
  creator_id uuid not null references public.creators(creator_id) on delete cascade,
  percentual_comissao numeric(5,2) not null default 0 check (percentual_comissao >= 0 and percentual_comissao <= 100),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (speaker_id, creator_id),
  unique (creator_id)
);

create index if not exists idx_speakers_empresa on public.speakers(empresa_id, ativo);
create index if not exists idx_speaker_creators_speaker on public.speaker_creators(speaker_id, ativo);
create index if not exists idx_speaker_creators_creator on public.speaker_creators(creator_id);

alter table public.speakers enable row level security;
alter table public.speaker_creators enable row level security;

drop policy if exists "speakers_empresa" on public.speakers;
create policy "speakers_empresa" on public.speakers for all to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "speaker_creators_empresa" on public.speaker_creators;
create policy "speaker_creators_empresa" on public.speaker_creators for all to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

grant select on public.speakers, public.speaker_creators to anon;
grant select, insert, update, delete on public.speakers, public.speaker_creators to authenticated;
grant select, insert, update, delete on public.speakers, public.speaker_creators to service_role;

insert into public.paginas_sistema (pagina_key, nome, rota, ordem, ativo)
values ('speakers', 'Speakers e rede', '/speakers', 3, true)
on conflict (pagina_key) do update set nome = excluded.nome, rota = excluded.rota, ativo = true;

insert into public.perfil_acesso_permissoes (perfil_acesso_id, pagina_key, pode_acessar, pode_criar, pode_editar, pode_excluir)
select perfil_acesso_id, 'speakers', true, true, true, true
from public.perfis_acesso
where slug in ('admin', 'operacional', 'suporte')
on conflict (perfil_acesso_id, pagina_key) do update set pode_acessar = true, pode_criar = true, pode_editar = true, pode_excluir = true;

commit;
