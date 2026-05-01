-- =========================================================
-- Funcionow Connect - Supabase mirror
-- File: 02_constraints_indexes.sql
-- Purpose: foreign keys and non-primary indexes
-- Generated from current Supabase project state.
-- =========================================================

-- Foreign keys
alter table public.usuarios
  add constraint fk_usuario_auth foreign key (usuario_id) references auth.users(id) on delete cascade;

alter table public.usuarios
  add constraint usuarios_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id);

alter table public.categorias
  add constraint categorias_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id);

alter table public.segmentos
  add constraint segmentos_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id);

alter table public.segmentos
  add constraint segmentos_categoria_id_fkey foreign key (categoria_id) references public.categorias(categoria_id);

alter table public.areas_speaker
  add constraint areas_speaker_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id);

alter table public.areas_speaker
  add constraint areas_speaker_segmento_id_fkey foreign key (segmento_id) references public.segmentos(segmento_id);

alter table public.funil_etapas
  add constraint funil_etapas_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id) on delete cascade;

alter table public.creators
  add constraint creators_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id);

alter table public.creators
  add constraint creators_categoria_id_fkey foreign key (categoria_id) references public.categorias(categoria_id);

alter table public.creator_captacao
  add constraint creator_captacao_creator_id_fkey foreign key (creator_id) references public.creators(creator_id) on delete cascade;

alter table public.creator_captacao
  add constraint creator_captacao_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id) on delete restrict;

alter table public.creator_captacao
  add constraint creator_captacao_segmento_id_fkey foreign key (segmento_id) references public.segmentos(segmento_id);

alter table public.creator_captacao
  add constraint creator_captacao_area_speaker_id_fkey foreign key (area_speaker_id) references public.areas_speaker(area_speaker_id);

alter table public.criterios_avaliacao
  add constraint criterios_avaliacao_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id) on delete cascade;

alter table public.criterios_avaliacao
  add constraint criterios_avaliacao_etapa_id_fkey foreign key (etapa_id) references public.funil_etapas(etapa_id);

alter table public.configuracoes_funil
  add constraint configuracoes_funil_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id) on delete cascade;

alter table public.creator_avaliacoes
  add constraint creator_avaliacoes_creator_id_fkey foreign key (creator_id) references public.creators(creator_id) on delete cascade;

alter table public.creator_avaliacoes
  add constraint creator_avaliacoes_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id) on delete cascade;

alter table public.creator_avaliacoes
  add constraint creator_avaliacoes_etapa_id_fkey foreign key (etapa_id) references public.funil_etapas(etapa_id) on delete cascade;

alter table public.resultado_criterio
  add constraint resultado_criterio_avaliacao_id_fkey foreign key (avaliacao_id) references public.creator_avaliacoes(avaliacao_id) on delete cascade;

alter table public.resultado_criterio
  add constraint resultado_criterio_criterio_id_fkey foreign key (criterio_id) references public.criterios_avaliacao(criterio_id) on delete cascade;

alter table public.resultado_criterio
  add constraint resultado_criterio_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id);

alter table public.membros_equipe
  add constraint membros_equipe_empresa_id_fkey foreign key (empresa_id) references public.empresas(empresa_id) on delete cascade;

alter table public.membros_equipe
  add constraint membros_equipe_usuario_id_fkey foreign key (usuario_id) references public.usuarios(usuario_id) on delete set null;

-- Indexes
create index if not exists idx_categorias_empresa on public.categorias using btree (empresa_id);
create index if not exists idx_segmentos_empresa on public.segmentos using btree (empresa_id);
create index if not exists idx_funil_etapas_empresa on public.funil_etapas using btree (empresa_id);
create index if not exists idx_funil_etapas_ordem on public.funil_etapas using btree (ordem);
create index if not exists idx_empresas_status on public.empresas using btree (status);
create index if not exists idx_usuarios_empresa on public.usuarios using btree (empresa_id);
create index if not exists idx_creators_empresa on public.creators using btree (empresa_id);
create unique index if not exists idx_creators_empresa_instagram_unique on public.creators using btree (empresa_id, instagram);
create index if not exists idx_creators_status on public.creators using btree (status);
create index if not exists idx_creator_captacao_empresa on public.creator_captacao using btree (empresa_id);
create index if not exists idx_creator_captacao_creator_data on public.creator_captacao using btree (creator_id, atualizado_em desc, captacao_id desc);
create index if not exists idx_criterios_etapa on public.criterios_avaliacao using btree (etapa_id);
create index if not exists idx_creator_avaliacoes_empresa on public.creator_avaliacoes using btree (empresa_id);
create index if not exists idx_avaliacoes_creator on public.creator_avaliacoes using btree (creator_id);
create index if not exists idx_avaliacoes_etapa on public.creator_avaliacoes using btree (etapa_id);
create index if not exists idx_creator_avaliacoes_creator_avaliado on public.creator_avaliacoes using btree (creator_id, avaliado_em desc, avaliacao_id desc);
create index if not exists idx_resultado_avaliacao on public.resultado_criterio using btree (avaliacao_id);
create index if not exists idx_resultado_criterio_empresa on public.resultado_criterio using btree (empresa_id);
create unique index if not exists idx_unique_resultado on public.resultado_criterio using btree (avaliacao_id, criterio_id);
create index if not exists idx_membros_equipe_empresa on public.membros_equipe using btree (empresa_id);
create index if not exists idx_membros_equipe_usuario on public.membros_equipe using btree (usuario_id);
create index if not exists idx_membros_equipe_status on public.membros_equipe using btree (status);
create index if not exists idx_membros_equipe_tipo on public.membros_equipe using btree (tipo_membro);
create unique index if not exists idx_membros_equipe_empresa_documento_unique on public.membros_equipe using btree (empresa_id, documento) where documento is not null and documento <> '';

-- =========================================================
-- Ajuste perfil de usuários
-- Permite admin, suporte e terceirizado
-- =========================================================

alter table public.usuarios
drop constraint if exists usuarios_perfil_check;

alter table public.usuarios
add constraint usuarios_perfil_check
check (
  perfil = any (
    array[
      'admin'::text,
      'suporte'::text,
      'terceirizado'::text
    ]
  )
);

-- =========================================================
-- Índices: perfis_usuario
-- =========================================================

create index if not exists idx_perfis_usuario_codigo_vinculo
on public.perfis_usuario using btree (codigo_vinculo);

create index if not exists idx_perfis_usuario_email
on public.perfis_usuario using btree (email);