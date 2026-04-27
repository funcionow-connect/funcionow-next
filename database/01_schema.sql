-- =========================================================
-- Funcionow Connect - Supabase mirror
-- File: 01_schema.sql
-- Purpose: current public tables and columns
-- Generated from current Supabase project state.
-- =========================================================

create table if not exists public.empresas (
  empresa_id uuid not null default gen_random_uuid(),
  nome text not null,
  segmento text null,
  status text null default 'ativo'::text,
  criada_em timestamp with time zone null default now(),
  constraint empresas_pkey primary key (empresa_id)
);

create table if not exists public.usuarios (
  usuario_id uuid not null,
  empresa_id uuid not null,
  nome text not null,
  email text not null,
  perfil text not null,
  status text null default 'ativo'::text,
  criado_em timestamp with time zone null default now(),
  constraint usuarios_pkey primary key (usuario_id),
  constraint usuarios_email_key unique (email),
  constraint usuarios_perfil_check check (perfil = any (array['admin'::text, 'suporte'::text]))
);

create table if not exists public.categorias (
  categoria_id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  empresa_id uuid not null,
  nome text not null,
  ativo boolean null default true,
  constraint categorias_pkey primary key (categoria_id)
);

create table if not exists public.segmentos (
  segmento_id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  empresa_id uuid not null,
  nome text not null,
  ativo boolean null,
  categoria_id uuid null,
  tem_especialidade boolean null default false,
  constraint segmentos_pkey primary key (segmento_id)
);

create table if not exists public.areas_speaker (
  area_speaker_id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  empresa_id uuid not null,
  nome text not null,
  ativo boolean null default true,
  segmento_id uuid not null,
  constraint areas_speaker_pkey primary key (area_speaker_id)
);

create table if not exists public.funil_etapas (
  etapa_id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  ordem integer not null,
  nome text not null,
  descricao text null,
  constraint funil_etapas_pkey primary key (etapa_id)
);

create table if not exists public.creators (
  creator_id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  nome text not null,
  instagram text not null,
  status text null default 'em_analise'::text,
  score_total numeric null,
  criado_em timestamp with time zone not null default now(),
  foto_url text null,
  categoria_id uuid null,
  constraint creators_pkey primary key (creator_id),
  constraint chk_status_funil check (status = any (array['em_analise'::text, 'potencial'::text, 'aprovado'::text, 'reprovado'::text])),
  constraint creators_status_check check (status = any (array['em_analise'::text, 'reprovado'::text, 'potencial'::text, 'aprovado'::text]))
);

create table if not exists public.creator_captacao (
  captacao_id uuid not null default gen_random_uuid(),
  creator_id uuid not null,
  empresa_id uuid not null,
  seguidores bigint null,
  curtidas_medias integer null,
  comentarios_medios integer null,
  atualizado_em timestamp with time zone not null default now(),
  tipo_creator text null,
  segmento_id uuid null,
  area_speaker_id uuid null,
  constraint creator_captacao_pkey primary key (captacao_id),
  constraint creator_captacao_creator_id_key unique (creator_id)
);

create table if not exists public.criterios_avaliacao (
  criterio_id uuid not null default gen_random_uuid(),
  empresa_id uuid null,
  etapa_id uuid null,
  nome text not null,
  tipo text null,
  peso numeric not null default 1,
  obrigatorio boolean not null default false,
  tipo_resposta text not null,
  ordem integer null,
  categoria_criterios text null,
  constraint criterios_avaliacao_pkey primary key (criterio_id),
  constraint criterios_avaliacao_tipo_check check (tipo = any (array['texto'::text, 'numero'::text, 'booleano'::text]))
);

create table if not exists public.configuracoes_funil (
  config_id uuid not null default gen_random_uuid(),
  empresa_id uuid not null,
  min_score_aprovacao numeric null default 7,
  permitir_potencial boolean null default true,
  permitir_revisao boolean null default true,
  min_score_potencial numeric null default 5,
  constraint configuracoes_funil_pkey primary key (config_id),
  constraint configuracoes_funil_empresa_id_key unique (empresa_id)
);

create table if not exists public.creator_avaliacoes (
  avaliacao_id uuid not null default gen_random_uuid(),
  creator_id uuid not null,
  empresa_id uuid not null,
  etapa_id uuid null,
  status_decisao text null,
  score_parcial numeric null,
  observacoes text null,
  avaliado_em timestamp with time zone null default now(),
  constraint creator_avaliacoes_pkey primary key (avaliacao_id),
  constraint creator_avaliacoes_creator_id_etapa_id_key unique (creator_id, etapa_id),
  constraint creator_avaliacoes_status_decisao_check check (status_decisao = any (array['reprovado'::text, 'potencial'::text, 'aprovado'::text]))
);

create table if not exists public.resultado_criterio (
  resultado_id uuid not null default gen_random_uuid(),
  avaliacao_id uuid not null,
  criterio_id uuid not null,
  valor text null,
  pontuacao_calculada numeric null,
  empresa_id uuid not null,
  constraint resultado_criterio_pkey primary key (resultado_id)
);

create table if not exists public.creator_auditoria (
  auditoria_id uuid not null default gen_random_uuid(),
  creator_id uuid not null,
  etapa integer not null,
  decisao text not null,
  justificativa text null,
  usuario_id uuid not null,
  usuario_nome text null,
  empresa_id uuid not null,
  criado_em timestamp with time zone null default now(),
  constraint creator_auditoria_pkey primary key (auditoria_id),
  constraint creator_auditoria_decisao_check check (decisao = any (array['aprovado'::text, 'potencial'::text, 'reprovado'::text]))
);
