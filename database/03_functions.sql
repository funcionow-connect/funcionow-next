-- =========================================================
-- Funcionow Connect - Supabase mirror
-- File: 03_functions.sql
-- Purpose: current public functions
-- Generated from current Supabase project state.
-- =========================================================

create or replace function public.fn_ao_criar_avaliacao()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  update public.creators
  set status = 'em_analise'
  where creator_id = new.creator_id;

  return new;
end;
$function$;

create or replace function public.fn_ao_reprovar_etapa()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  if new.status_decisao = 'reprovado' then
    update public.creators
    set status = 'reprovado'
    where creator_id = new.creator_id;
  end if;

  return new;
end;
$function$;

create or replace function public.fn_atualizar_score_total_creator()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  update public.creators
  set score_total = (
    select sum(score_etapa)
    from public.creator_avaliacoes
    where creator_id = new.creator_id
  )
  where creator_id = new.creator_id;

  return new;
end;
$function$;

create or replace function public.fn_calcular_tipo_creator()
returns trigger
language plpgsql
as $function$
begin
  if new.seguidores is null then
    new.tipo_creator := null;
  elsif new.seguidores <= 10000 then
    new.tipo_creator := 'nano';
  elsif new.seguidores <= 100000 then
    new.tipo_creator := 'micro';
  elsif new.seguidores <= 500000 then
    new.tipo_creator := 'meso';
  elsif new.seguidores <= 1000000 then
    new.tipo_creator := 'macro';
  else
    new.tipo_creator := 'mega';
  end if;

  return new;
end;
$function$;

create or replace function public.fn_registrar_auditoria_decisao()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_usuario_nome text;
  v_empresa_id uuid;
begin
  select u.nome, u.empresa_id
  into v_usuario_nome, v_empresa_id
  from public.usuarios u
  where u.usuario_id = auth.uid();

  insert into public.creator_auditoria (
    creator_id,
    etapa,
    decisao,
    justificativa,
    usuario_id,
    usuario_nome,
    empresa_id
  )
  values (
    new.creator_id,
    new.etapa,
    new.decisao,
    new.justificativa,
    auth.uid(),
    v_usuario_nome,
    v_empresa_id
  );

  return new;
end;
$function$;

create or replace function public.fn_sugerir_proxima_etapa()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  proxima_etapa int;
begin
  if new.status_decisao = 'aprovado' then
    select etapa_ordem + 1 into proxima_etapa
    from public.funil_etapas
    where etapa_id = new.etapa_id;

    insert into public.creator_avaliacoes (
      creator_id,
      empresa_id,
      etapa_id,
      status_decisao
    )
    values (
      new.creator_id,
      new.empresa_id,
      proxima_etapa,
      'pendente'
    )
    on conflict do nothing;
  end if;

  return new;
end;
$function$;

create or replace function public.fn_validar_avanco_etapa()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  etapa_atual int;
begin
  select coalesce(max(etapa), 0)
  into etapa_atual
  from public.creator_avaliacoes
  where creator_id = new.creator_id;

  if new.etapa > etapa_atual + 1 then
    raise exception 'Avanço inválido: etapa % não pode pular da etapa %', new.etapa, etapa_atual;
  end if;

  if new.decisao is null then
    raise exception 'É obrigatório informar a decisão (aprovado, potencial ou reprovado)';
  end if;

  if new.decisao = 'reprovado' and new.etapa > etapa_atual then
    raise exception 'Creator reprovado não pode avançar de etapa';
  end if;

  return new;
end;
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  nova_empresa_id uuid;
  nome_empresa text;
  nome_usuario text;
begin
  nome_empresa := coalesce(new.raw_user_meta_data->>'empresa_nome', 'Empresa de ' || new.email);
  nome_usuario := coalesce(new.raw_user_meta_data->>'nome', 'Admin');

  insert into public.empresas (nome)
  values (nome_empresa)
  returning empresa_id into nova_empresa_id;

  insert into public.usuarios (usuario_id, empresa_id, nome, email, perfil)
  values (
    new.id,
    nova_empresa_id,
    nome_usuario,
    new.email,
    'admin'
  );

  return new;
end;
$function$;

create or replace function public.reordenar_criterios_avaliacao(p_empresa_id uuid)
returns void
language plpgsql
as $function$
begin
  with ordenados as (
    select
      criterio_id,
      row_number() over (
        order by
          coalesce(ordem, 999999),
          nome
      ) as nova_ordem
    from public.criterios_avaliacao
    where empresa_id = p_empresa_id
  )
  update public.criterios_avaliacao ca
  set ordem = o.nova_ordem
  from ordenados o
  where ca.criterio_id = o.criterio_id;
end;
$function$;

create or replace function public.salvar_avaliacao_creator(
  p_creator_id uuid,
  p_empresa_id uuid,
  p_score_parcial numeric,
  p_observacoes text,
  p_respostas jsonb,
  p_avaliacao_id uuid default null::uuid,
  p_etapa_id uuid default null::uuid,
  p_status_decisao text default null::text
)
returns uuid
language plpgsql
as $function$
declare
  v_avaliacao_id uuid;
  v_criterio_id uuid;
  v_item jsonb;
  v_status text;
  v_min_score_aprovacao numeric := 7;
  v_min_score_potencial numeric := 5;
  v_permitir_potencial boolean := true;
  v_score_normalizado numeric := 0;
begin
  select
    coalesce(cf.min_score_aprovacao, 7),
    coalesce(cf.min_score_potencial, 5),
    coalesce(cf.permitir_potencial, true)
  into
    v_min_score_aprovacao,
    v_min_score_potencial,
    v_permitir_potencial
  from public.configuracoes_funil cf
  where cf.empresa_id = p_empresa_id
  limit 1;

  v_min_score_aprovacao := coalesce(v_min_score_aprovacao, 7);
  v_min_score_potencial := coalesce(v_min_score_potencial, 5);
  v_permitir_potencial := coalesce(v_permitir_potencial, true);

  if p_avaliacao_id is null then
    insert into public.creator_avaliacoes (
      creator_id,
      empresa_id,
      etapa_id,
      status_decisao,
      score_parcial,
      observacoes,
      avaliado_em
    )
    values (
      p_creator_id,
      p_empresa_id,
      p_etapa_id,
      'reprovado',
      p_score_parcial,
      p_observacoes,
      now()
    )
    returning avaliacao_id into v_avaliacao_id;
  else
    update public.creator_avaliacoes
    set
      etapa_id = coalesce(p_etapa_id, etapa_id),
      score_parcial = p_score_parcial,
      observacoes = p_observacoes,
      avaliado_em = now()
    where avaliacao_id = p_avaliacao_id
    returning avaliacao_id into v_avaliacao_id;
  end if;

  for v_criterio_id, v_item in
    select key::uuid, value
    from jsonb_each(p_respostas)
  loop
    insert into public.resultado_criterio (
      avaliacao_id,
      criterio_id,
      valor,
      pontuacao_calculada,
      empresa_id
    )
    values (
      v_avaliacao_id,
      v_criterio_id,
      v_item->>'valor',
      coalesce((v_item->>'pontuacao')::numeric, 0),
      p_empresa_id
    )
    on conflict (avaliacao_id, criterio_id)
    do update set
      valor = excluded.valor,
      pontuacao_calculada = excluded.pontuacao_calculada,
      empresa_id = excluded.empresa_id;
  end loop;

  select
    case
      when coalesce(sum(cri.peso), 0) > 0 then
        round((coalesce(sum(rc.pontuacao_calculada), 0) / sum(cri.peso)) * 10, 2)
      else 0
    end
  into v_score_normalizado
  from public.resultado_criterio rc
  join public.criterios_avaliacao cri
    on cri.criterio_id = rc.criterio_id
  where rc.avaliacao_id = v_avaliacao_id;

  if v_score_normalizado >= v_min_score_aprovacao then
    v_status := 'aprovado';
  elsif v_permitir_potencial and v_score_normalizado >= v_min_score_potencial then
    v_status := 'potencial';
  else
    v_status := 'reprovado';
  end if;

  update public.creator_avaliacoes
  set
    status_decisao = v_status,
    score_parcial = v_score_normalizado
  where avaliacao_id = v_avaliacao_id;

  update public.creators
  set
    status = v_status,
    score_total = v_score_normalizado
  where creator_id = p_creator_id
    and empresa_id = p_empresa_id;

  return v_avaliacao_id;
end;
$function$;

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.atualizado_em := now();
  return new;
end;
$function$;

-- NOTE: public.get_complete_schema exists in the current database as an introspection helper.
-- It was intentionally not included here because it is not part of the application runtime.
