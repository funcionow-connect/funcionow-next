-- =========================================================
-- Funcionow Connect - Supabase mirror
-- File: 06_rls.sql
-- Purpose: current RLS enablement and policies
-- Generated from current Supabase project state.
-- =========================================================

alter table public.areas_speaker enable row level security;
alter table public.categorias enable row level security;
alter table public.configuracoes_funil enable row level security;
alter table public.creator_avaliacoes enable row level security;
alter table public.creator_captacao enable row level security;
alter table public.creators enable row level security;
alter table public.criterios_avaliacao enable row level security;
alter table public.empresas enable row level security;
alter table public.funil_etapas enable row level security;
alter table public.resultado_criterio enable row level security;
alter table public.segmentos enable row level security;
alter table public.usuarios enable row level security;
alter table public.membros_equipe enable row level security;

-- areas_speaker
drop policy if exists "areas_speaker_insert_empresa" on public.areas_speaker;
create policy "areas_speaker_insert_empresa" on public.areas_speaker
for insert to authenticated
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "areas_speaker_select_empresa" on public.areas_speaker;
create policy "areas_speaker_select_empresa" on public.areas_speaker
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- categorias
drop policy if exists "Inserir categoria" on public.categorias;
create policy "Inserir categoria" on public.categorias
for insert to authenticated
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "Selecionar categoria" on public.categorias;
create policy "Selecionar categoria" on public.categorias
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- configuracoes_funil
drop policy if exists "config_funil_insert_empresa" on public.configuracoes_funil;
create policy "config_funil_insert_empresa" on public.configuracoes_funil
for insert to authenticated
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "config_funil_select" on public.configuracoes_funil;
create policy "config_funil_select" on public.configuracoes_funil
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "config_funil_select_empresa" on public.configuracoes_funil;
create policy "config_funil_select_empresa" on public.configuracoes_funil
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "config_funil_update_empresa" on public.configuracoes_funil;
create policy "config_funil_update_empresa" on public.configuracoes_funil
for update to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()))
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- creator_avaliacoes
drop policy if exists "avaliacoes_insert" on public.creator_avaliacoes;
create policy "avaliacoes_insert" on public.creator_avaliacoes
for insert to authenticated
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "avaliacoes_select" on public.creator_avaliacoes;
create policy "avaliacoes_select" on public.creator_avaliacoes
for select to authenticated
using (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = creator_avaliacoes.empresa_id));

drop policy if exists "avaliacoes_update" on public.creator_avaliacoes;
create policy "avaliacoes_update" on public.creator_avaliacoes
for update to authenticated
using (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = creator_avaliacoes.empresa_id))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

-- creator_captacao
drop policy if exists "captacao_insert_empresa" on public.creator_captacao;
create policy "captacao_insert_empresa" on public.creator_captacao
for insert to authenticated
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "captacao_select_empresa" on public.creator_captacao;
create policy "captacao_select_empresa" on public.creator_captacao
for select to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "captacao_update_empresa" on public.creator_captacao;
create policy "captacao_update_empresa" on public.creator_captacao
for update to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

-- creators
drop policy if exists "creators_insert" on public.creators;
create policy "creators_insert" on public.creators
for insert to authenticated
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "creators_select" on public.creators;
create policy "creators_select" on public.creators
for select to authenticated
using (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = creators.empresa_id));

drop policy if exists "creators_update" on public.creators;
create policy "creators_update" on public.creators
for update to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- criterios_avaliacao
drop policy if exists "criterios_avaliacao_delete_empresa" on public.criterios_avaliacao;
create policy "criterios_avaliacao_delete_empresa" on public.criterios_avaliacao
for delete to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "criterios_avaliacao_insert_empresa" on public.criterios_avaliacao;
create policy "criterios_avaliacao_insert_empresa" on public.criterios_avaliacao
for insert to authenticated
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "criterios_avaliacao_select_empresa" on public.criterios_avaliacao;
create policy "criterios_avaliacao_select_empresa" on public.criterios_avaliacao
for select to authenticated
using ((empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid())) or empresa_id is null);

drop policy if exists "criterios_avaliacao_update_empresa" on public.criterios_avaliacao;
create policy "criterios_avaliacao_update_empresa" on public.criterios_avaliacao
for update to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()))
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "criterios_select" on public.criterios_avaliacao;
create policy "criterios_select" on public.criterios_avaliacao
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- empresas
drop policy if exists "Cadastro - inserir empresa" on public.empresas;
create policy "Cadastro - inserir empresa" on public.empresas
for insert to public
with check (auth.uid() is not null);

drop policy if exists "empresas_select" on public.empresas;
create policy "empresas_select" on public.empresas
for select to authenticated
using (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = empresas.empresa_id));

drop policy if exists "empresas_update" on public.empresas;
create policy "empresas_update" on public.empresas
for update to authenticated
using (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = empresas.empresa_id))
with check (exists (select 1 from public.usuarios u where u.usuario_id = auth.uid() and u.empresa_id = empresas.empresa_id));

-- funil_etapas
drop policy if exists "funil_etapas_select" on public.funil_etapas;
create policy "funil_etapas_select" on public.funil_etapas
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- membros_equipe
drop policy if exists "membros_equipe_select_empresa" on public.membros_equipe;
create policy "membros_equipe_select_empresa" on public.membros_equipe
for select to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "membros_equipe_insert_empresa" on public.membros_equipe;
create policy "membros_equipe_insert_empresa" on public.membros_equipe
for insert to authenticated
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "membros_equipe_update_empresa" on public.membros_equipe;
create policy "membros_equipe_update_empresa" on public.membros_equipe
for update to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()))
with check (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

drop policy if exists "membros_equipe_delete_empresa" on public.membros_equipe;
create policy "membros_equipe_delete_empresa" on public.membros_equipe
for delete to authenticated
using (empresa_id in (select u.empresa_id from public.usuarios u where u.usuario_id = auth.uid()));

-- resultado_criterio
drop policy if exists "resultado_criterio_insert" on public.resultado_criterio;
create policy "resultado_criterio_insert" on public.resultado_criterio
for insert to authenticated
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "resultado_criterio_select" on public.resultado_criterio;
create policy "resultado_criterio_select" on public.resultado_criterio
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "resultado_criterio_update" on public.resultado_criterio;
create policy "resultado_criterio_update" on public.resultado_criterio
for update to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()))
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- segmentos
drop policy if exists "segmentos_insert_empresa" on public.segmentos;
create policy "segmentos_insert_empresa" on public.segmentos
for insert to authenticated
with check (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

drop policy if exists "segmentos_select_empresa" on public.segmentos;
create policy "segmentos_select_empresa" on public.segmentos
for select to authenticated
using (empresa_id in (select usuarios.empresa_id from public.usuarios where usuarios.usuario_id = auth.uid()));

-- usuarios
drop policy if exists "Permitir inserir próprio usuário" on public.usuarios;
create policy "Permitir inserir próprio usuário" on public.usuarios
for insert to authenticated
with check (usuario_id = auth.uid());

drop policy if exists "Usuario - ler proprio registro" on public.usuarios;
create policy "Usuario - ler proprio registro" on public.usuarios
for select to authenticated
using (usuario_id = auth.uid());

drop policy if exists "usuarios_update_proprio" on public.usuarios;
create policy "usuarios_update_proprio" on public.usuarios
for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

-- =========================================================
-- RLS: perfis_usuario
-- Usuário só lê/edita o próprio perfil
-- =========================================================

alter table public.perfis_usuario enable row level security;

drop policy if exists "perfis_usuario_select_proprio"
on public.perfis_usuario;

create policy "perfis_usuario_select_proprio"
on public.perfis_usuario
for select
to authenticated
using (usuario_id = auth.uid());

drop policy if exists "perfis_usuario_update_proprio"
on public.perfis_usuario;

create policy "perfis_usuario_update_proprio"
on public.perfis_usuario
for update
to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

drop policy if exists "perfis_usuario_insert_proprio"
on public.perfis_usuario;

create policy "perfis_usuario_insert_proprio"
on public.perfis_usuario
for insert
to authenticated
with check (usuario_id = auth.uid());

-- =========================================================
-- RLS: paginas_sistema
-- =========================================================

alter table public.paginas_sistema enable row level security;

drop policy if exists "paginas_sistema_select_authenticated"
on public.paginas_sistema;

create policy "paginas_sistema_select_authenticated"
on public.paginas_sistema
for select
to authenticated
using (true);


-- =========================================================
-- RLS: perfis_acesso
-- =========================================================

alter table public.perfis_acesso enable row level security;

drop policy if exists "perfis_acesso_select_empresa"
on public.perfis_acesso;

create policy "perfis_acesso_select_empresa"
on public.perfis_acesso
for select
to authenticated
using (
  empresa_id in (
    select u.empresa_id
    from public.usuarios u
    where u.usuario_id = auth.uid()
  )
);

drop policy if exists "perfis_acesso_insert_admin_empresa"
on public.perfis_acesso;

create policy "perfis_acesso_insert_admin_empresa"
on public.perfis_acesso
for insert
to authenticated
with check (
  empresa_id in (
    select u.empresa_id
    from public.usuarios u
    where u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
);

drop policy if exists "perfis_acesso_update_admin_empresa"
on public.perfis_acesso;

create policy "perfis_acesso_update_admin_empresa"
on public.perfis_acesso
for update
to authenticated
using (
  empresa_id in (
    select u.empresa_id
    from public.usuarios u
    where u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
)
with check (
  empresa_id in (
    select u.empresa_id
    from public.usuarios u
    where u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
);

drop policy if exists "perfis_acesso_delete_admin_empresa"
on public.perfis_acesso;

create policy "perfis_acesso_delete_admin_empresa"
on public.perfis_acesso
for delete
to authenticated
using (
  empresa_id in (
    select u.empresa_id
    from public.usuarios u
    where u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
  and sistema = false
);


-- =========================================================
-- RLS: perfil_acesso_permissoes
-- =========================================================

alter table public.perfil_acesso_permissoes enable row level security;

drop policy if exists "perfil_acesso_permissoes_select_empresa"
on public.perfil_acesso_permissoes;

create policy "perfil_acesso_permissoes_select_empresa"
on public.perfil_acesso_permissoes
for select
to authenticated
using (
  exists (
    select 1
    from public.perfis_acesso pa
    join public.usuarios u
      on u.empresa_id = pa.empresa_id
    where pa.perfil_acesso_id = perfil_acesso_permissoes.perfil_acesso_id
      and u.usuario_id = auth.uid()
  )
);

drop policy if exists "perfil_acesso_permissoes_insert_admin_empresa"
on public.perfil_acesso_permissoes;

create policy "perfil_acesso_permissoes_insert_admin_empresa"
on public.perfil_acesso_permissoes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.perfis_acesso pa
    join public.usuarios u
      on u.empresa_id = pa.empresa_id
    where pa.perfil_acesso_id = perfil_acesso_permissoes.perfil_acesso_id
      and u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
);

drop policy if exists "perfil_acesso_permissoes_update_admin_empresa"
on public.perfil_acesso_permissoes;

create policy "perfil_acesso_permissoes_update_admin_empresa"
on public.perfil_acesso_permissoes
for update
to authenticated
using (
  exists (
    select 1
    from public.perfis_acesso pa
    join public.usuarios u
      on u.empresa_id = pa.empresa_id
    where pa.perfil_acesso_id = perfil_acesso_permissoes.perfil_acesso_id
      and u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.perfis_acesso pa
    join public.usuarios u
      on u.empresa_id = pa.empresa_id
    where pa.perfil_acesso_id = perfil_acesso_permissoes.perfil_acesso_id
      and u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
);

drop policy if exists "perfil_acesso_permissoes_delete_admin_empresa"
on public.perfil_acesso_permissoes;

create policy "perfil_acesso_permissoes_delete_admin_empresa"
on public.perfil_acesso_permissoes
for delete
to authenticated
using (
  exists (
    select 1
    from public.perfis_acesso pa
    join public.usuarios u
      on u.empresa_id = pa.empresa_id
    where pa.perfil_acesso_id = perfil_acesso_permissoes.perfil_acesso_id
      and u.usuario_id = auth.uid()
      and u.perfil = 'admin'
  )
);