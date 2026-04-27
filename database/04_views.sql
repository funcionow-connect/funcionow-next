-- =========================================================
-- Funcionow Connect - Supabase mirror
-- File: 04_views.sql
-- Purpose: current public views
-- Generated from current Supabase project state.
-- =========================================================

create or replace view public.v_creator_detalhe as
with ultima_captacao as (
  select distinct on (cc.creator_id)
    cc.captacao_id,
    cc.creator_id,
    cc.empresa_id,
    cc.seguidores,
    cc.curtidas_medias,
    cc.comentarios_medios,
    cc.atualizado_em,
    cc.tipo_creator,
    cc.segmento_id,
    cc.area_speaker_id
  from public.creator_captacao cc
  order by cc.creator_id, cc.atualizado_em desc
),
ultima_avaliacao as (
  select distinct on (ca.creator_id)
    ca.avaliacao_id,
    ca.creator_id,
    ca.empresa_id,
    ca.etapa_id,
    ca.status_decisao,
    ca.score_parcial,
    ca.observacoes,
    ca.avaliado_em
  from public.creator_avaliacoes ca
  order by ca.creator_id, ca.avaliado_em desc
),
score_fit_json as (
  select
    ua.creator_id,
    jsonb_agg(
      jsonb_build_object(
        'criterio_id', cri.criterio_id,
        'criterio_nome', cri.nome,
        'ordem', cri.ordem,
        'peso', cri.peso,
        'tipo_resposta', cri.tipo_resposta,
        'valor', rc.valor,
        'pontuacao_calculada', rc.pontuacao_calculada
      ) order by cri.ordem, cri.nome
    ) as score_fit_detalhes
  from ultima_avaliacao ua
  left join public.resultado_criterio rc on rc.avaliacao_id = ua.avaliacao_id
  left join public.criterios_avaliacao cri on cri.criterio_id = rc.criterio_id
  group by ua.creator_id
)
select
  c.creator_id,
  c.empresa_id,
  c.nome,
  c.instagram,
  'https://instagram.com/'::text || c.instagram as instagram_url,
  c.status,
  c.score_total,
  c.criado_em,
  c.foto_url,
  c.categoria_id,
  cat.nome as categoria_nome,
  uc.captacao_id,
  uc.seguidores,
  uc.curtidas_medias,
  uc.comentarios_medios,
  uc.atualizado_em as captacao_atualizado_em,
  uc.tipo_creator,
  uc.segmento_id,
  seg.nome as segmento_nome,
  uc.area_speaker_id,
  asp.nome as area_speaker_nome,
  round(((coalesce(uc.curtidas_medias, 0) + coalesce(uc.comentarios_medios, 0))::numeric / nullif(uc.seguidores, 0)::numeric) * 100::numeric, 3) as engajamento,
  ua.avaliacao_id,
  ua.etapa_id,
  fe.nome as etapa_nome,
  fe.ordem as etapa_ordem,
  ua.status_decisao,
  ua.score_parcial,
  ua.observacoes,
  ua.avaliado_em,
  coalesce(sf.score_fit_detalhes, '[]'::jsonb) as score_fit_detalhes
from public.creators c
left join public.categorias cat on cat.categoria_id = c.categoria_id
left join ultima_captacao uc on uc.creator_id = c.creator_id
left join public.segmentos seg on seg.segmento_id = uc.segmento_id
left join public.areas_speaker asp on asp.area_speaker_id = uc.area_speaker_id
left join ultima_avaliacao ua on ua.creator_id = c.creator_id
left join public.funil_etapas fe on fe.etapa_id = ua.etapa_id
left join score_fit_json sf on sf.creator_id = c.creator_id;

create or replace view public.v_creator_score_fit as
with ultima_avaliacao as (
  select distinct on (ca.creator_id)
    ca.avaliacao_id,
    ca.creator_id,
    ca.empresa_id,
    ca.etapa_id,
    ca.status_decisao,
    ca.score_parcial,
    ca.observacoes,
    ca.avaliado_em
  from public.creator_avaliacoes ca
  order by ca.creator_id, ca.avaliado_em desc, ca.avaliacao_id desc
)
select
  ua.creator_id,
  ua.empresa_id,
  ua.avaliacao_id,
  ua.etapa_id,
  ua.status_decisao,
  ua.score_parcial,
  ua.observacoes,
  ua.avaliado_em,
  cri.criterio_id,
  cri.nome as criterio_nome,
  cri.ordem,
  cri.peso,
  cri.tipo_resposta,
  rc.resultado_id,
  rc.valor,
  rc.pontuacao_calculada
from ultima_avaliacao ua
left join public.resultado_criterio rc on rc.avaliacao_id = ua.avaliacao_id
left join public.criterios_avaliacao cri on cri.criterio_id = rc.criterio_id
order by ua.creator_id, cri.ordem, cri.nome;

create or replace view public.v_funil_lista as
with ultima_captacao as (
  select distinct on (cc.creator_id)
    cc.creator_id,
    cc.segmento_id,
    cc.area_speaker_id,
    cc.seguidores,
    cc.curtidas_medias,
    cc.comentarios_medios
  from public.creator_captacao cc
  order by cc.creator_id, cc.atualizado_em desc
),
ultima_avaliacao as (
  select distinct on (ca.creator_id)
    ca.creator_id,
    ca.score_parcial,
    ca.status_decisao,
    ca.avaliado_em
  from public.creator_avaliacoes ca
  order by ca.creator_id, ca.avaliado_em desc
)
select
  c.creator_id,
  c.empresa_id,
  c.nome,
  c.instagram,
  c.criado_em,
  cat.nome as categoria,
  seg.nome as segmento,
  asp.nome as especialidade,
  round(((coalesce(uc.curtidas_medias, 0) + coalesce(uc.comentarios_medios, 0))::numeric / nullif(uc.seguidores, 0)::numeric) * 100::numeric, 3) as engajamento,
  ua.score_parcial,
  case
    when ua.creator_id is null then 'Em análise'::text
    when ua.status_decisao = 'aprovado'::text then 'Aprovado'::text
    when ua.status_decisao = 'reprovado'::text then 'Reprovado'::text
    when ua.status_decisao = 'potencial'::text then 'Potencial'::text
    else 'Em análise'::text
  end as status,
  case
    when ua.creator_id is null then 0
    else 1
  end as ordem_avaliacao
from public.creators c
left join public.categorias cat on cat.categoria_id = c.categoria_id
left join ultima_captacao uc on uc.creator_id = c.creator_id
left join public.segmentos seg on seg.segmento_id = uc.segmento_id
left join public.areas_speaker asp on asp.area_speaker_id = uc.area_speaker_id
left join ultima_avaliacao ua on ua.creator_id = c.creator_id;
