-- =========================================================
-- Funcionow Connect - Supabase mirror
-- File: 03_functions.sql
-- Purpose: current public functions
-- Generated from current Supabase project state.
-- =========================================================

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

-- =========================================================
-- Função: handle_new_user
-- Cria perfil pessoal para todo usuário.
-- Se tipo_cadastro = 'usuario', não cria empresa.
-- Caso contrário, mantém fluxo antigo: empresa + usuário admin.
-- =========================================================

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
  tipo_cadastro text;
  codigo_gerado text;
begin
  tipo_cadastro := coalesce(new.raw_user_meta_data->>'tipo_cadastro', 'empresa');
  nome_empresa := coalesce(new.raw_user_meta_data->>'empresa_nome', 'Empresa de ' || new.email);
  nome_usuario := coalesce(new.raw_user_meta_data->>'nome', 'Admin');

  codigo_gerado := public.gerar_codigo_vinculo_usuario();

  insert into public.perfis_usuario (
    usuario_id,
    nome,
    email,
    codigo_vinculo
  )
  values (
    new.id,
    nome_usuario,
    new.email,
    codigo_gerado
  )
  on conflict (usuario_id)
  do update set
    nome = excluded.nome,
    email = excluded.email;

  if tipo_cadastro = 'usuario' then
    return new;
  end if;

  insert into public.empresas (nome)
  values (nome_empresa)
  returning empresa_id into nova_empresa_id;

  insert into public.usuarios (
    usuario_id,
    empresa_id,
    nome,
    email,
    perfil
  )
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

-- =========================================================
-- Função: gerar_codigo_vinculo_usuario
-- Gera código único de vínculo para usuário
-- =========================================================

create or replace function public.gerar_codigo_vinculo_usuario()
returns text
language plpgsql
as $function$
declare
  v_codigo text;
  v_existe boolean;
begin
  loop
    v_codigo := upper(
      substring(md5(random()::text || clock_timestamp()::text), 1, 8)
    );

    select exists (
      select 1
      from public.perfis_usuario pu
      where pu.codigo_vinculo = v_codigo
    )
    into v_existe;

    exit when not v_existe;
  end loop;

  return v_codigo;
end;
$function$;

-- =========================================================
-- Função: buscar_perfil_por_codigo_vinculo
-- Busca perfil pelo código de vínculo
-- =========================================================

create or replace function public.buscar_perfil_por_codigo_vinculo(p_codigo text)
returns table (
  usuario_id uuid,
  nome text,
  email text,
  telefone text,
  whatsapp text,
  tipo_documento text,
  documento text,
  cidade text,
  estado text,
  codigo_vinculo text
)
language sql
security definer
set search_path = public
as $function$
  select
    pu.usuario_id,
    pu.nome,
    pu.email,
    pu.telefone,
    pu.whatsapp,
    pu.tipo_documento,
    pu.documento,
    pu.cidade,
    pu.estado,
    pu.codigo_vinculo
  from public.perfis_usuario pu
  where pu.codigo_vinculo = upper(trim(p_codigo))
  limit 1;
$function$;

grant execute on function public.buscar_perfil_por_codigo_vinculo(text) to authenticated;

-- =========================================================
-- Função: vincular_membro_por_codigo
-- Vincula membro da equipe a um usuário por código
-- =========================================================

drop function if exists public.vincular_membro_por_codigo(uuid, text, text);

create or replace function public.vincular_membro_por_codigo(
  p_membro_id uuid,
  p_codigo_vinculo text,
  p_perfil text default 'suporte'
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_empresa_id uuid;
  v_admin_empresa_id uuid;
  v_usuario_id uuid;
  v_nome text;
  v_email text;
begin
  if p_perfil not in ('admin', 'suporte', 'terceirizado') then
    raise exception 'Perfil inválido. Use admin, suporte ou terceirizado.';
  end if;

  select u.empresa_id
  into v_admin_empresa_id
  from public.usuarios as u
  where u.usuario_id = auth.uid()
  limit 1;

  if v_admin_empresa_id is null then
    raise exception 'Usuário logado não possui empresa vinculada.';
  end if;

  select me.empresa_id
  into v_empresa_id
  from public.membros_equipe as me
  where me.membro_id = p_membro_id
    and me.empresa_id = v_admin_empresa_id
  limit 1;

  if v_empresa_id is null then
    raise exception 'Membro não encontrado para esta empresa.';
  end if;

  select
    pu.usuario_id,
    pu.nome,
    pu.email
  into
    v_usuario_id,
    v_nome,
    v_email
  from public.perfis_usuario as pu
  where pu.codigo_vinculo = upper(trim(p_codigo_vinculo))
  limit 1;

  if v_usuario_id is null then
    raise exception 'Código de vínculo não encontrado.';
  end if;

  insert into public.usuarios (
    usuario_id,
    empresa_id,
    nome,
    email,
    perfil,
    status
  )
  values (
    v_usuario_id,
    v_empresa_id,
    v_nome,
    v_email,
    p_perfil,
    'ativo'
  )
  on conflict on constraint usuarios_pkey
  do update set
    empresa_id = excluded.empresa_id,
    nome = excluded.nome,
    email = excluded.email,
    perfil = excluded.perfil,
    status = 'ativo';

  update public.membros_equipe as me
  set
    usuario_id = v_usuario_id,
    email = coalesce(me.email, v_email),
    status = 'ativo'
  where me.membro_id = p_membro_id
    and me.empresa_id = v_empresa_id;
end;
$function$;

grant execute on function public.vincular_membro_por_codigo(uuid, text, text) to authenticated;

-- =========================================================
-- Função: criar_membro_por_codigo
-- Cria/atualiza membro da equipe a partir do código de vínculo
-- e cria o vínculo do usuário com a empresa.
-- =========================================================


create or replace function public.criar_membro_por_codigo(
  p_codigo_vinculo text,
  p_tipo_membro text default 'colaborador',
  p_cargo text default null,
  p_perfil text default 'suporte',
  p_status text default 'ativo',
  p_chave_pix text default null,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_empresa_id uuid;
  v_usuario_id uuid;
  v_nome text;
  v_email text;
  v_telefone text;
  v_whatsapp text;
  v_tipo_documento text;
  v_documento text;
  v_cep text;
  v_endereco text;
  v_numero text;
  v_complemento text;
  v_bairro text;
  v_cidade text;
  v_estado text;
  v_membro_id uuid;
  v_empresa_usuario_existente uuid;
begin
  if p_tipo_membro not in ('colaborador', 'terceirizado', 'parceiro') then
    raise exception 'Tipo de membro inválido. Use colaborador, terceirizado ou parceiro.';
  end if;


  if p_perfil not in ('admin', 'suporte', 'terceirizado') then
    raise exception 'Perfil inválido. Use admin, suporte ou terceirizado.';
  end if;


  if p_status not in ('ativo', 'inativo') then
    raise exception 'Status inválido. Use ativo ou inativo.';
  end if;


  select u.empresa_id
  into v_empresa_id
  from public.usuarios u
  where u.usuario_id = auth.uid()
  limit 1;


  if v_empresa_id is null then
    raise exception 'Usuário logado não possui empresa vinculada.';
  end if;


  select
    pu.usuario_id,
    pu.nome,
    pu.email,
    pu.telefone,
    pu.whatsapp,
    pu.tipo_documento,
    pu.documento,
    pu.cep,
    pu.endereco,
    pu.numero,
    pu.complemento,
    pu.bairro,
    pu.cidade,
    pu.estado
  into
    v_usuario_id,
    v_nome,
    v_email,
    v_telefone,
    v_whatsapp,
    v_tipo_documento,
    v_documento,
    v_cep,
    v_endereco,
    v_numero,
    v_complemento,
    v_bairro,
    v_cidade,
    v_estado
  from public.perfis_usuario pu
  where pu.codigo_vinculo = upper(trim(p_codigo_vinculo))
  limit 1;


  if v_usuario_id is null then
    raise exception 'Código de vínculo não encontrado.';
  end if;


  select u.empresa_id
  into v_empresa_usuario_existente
  from public.usuarios u
  where u.usuario_id = v_usuario_id
  limit 1;


  if v_empresa_usuario_existente is not null
     and v_empresa_usuario_existente <> v_empresa_id then
    raise exception 'Este usuário já está vinculado a outra empresa.';
  end if;


  -- Primeiro cria/atualiza o vínculo do usuário com a empresa
  insert into public.usuarios (
    usuario_id,
    empresa_id,
    nome,
    email,
    perfil,
    status
  )
  values (
    v_usuario_id,
    v_empresa_id,
    v_nome,
    v_email,
    p_perfil,
    'ativo'
  )
  on conflict on constraint usuarios_pkey
  do update set
    empresa_id = excluded.empresa_id,
    nome = excluded.nome,
    email = excluded.email,
    perfil = excluded.perfil,
    status = 'ativo';


  -- Depois cria/atualiza o membro da equipe
  select me.membro_id
  into v_membro_id
  from public.membros_equipe me
  where me.empresa_id = v_empresa_id
    and (
      me.usuario_id = v_usuario_id
      or lower(coalesce(me.email, '')) = lower(v_email)
    )
  limit 1;


  if v_membro_id is null then
    insert into public.membros_equipe (
      empresa_id,
      usuario_id,
      nome,
      tipo_membro,
      cargo,
      status,
      email,
      telefone,
      whatsapp,
      tipo_documento,
      documento,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      chave_pix,
      observacoes
    )
    values (
      v_empresa_id,
      v_usuario_id,
      v_nome,
      p_tipo_membro,
      nullif(trim(p_cargo), ''),
      p_status,
      v_email,
      v_telefone,
      v_whatsapp,
      v_tipo_documento,
      v_documento,
      v_cep,
      v_endereco,
      v_numero,
      v_complemento,
      v_bairro,
      v_cidade,
      v_estado,
      nullif(trim(p_chave_pix), ''),
      nullif(trim(p_observacoes), '')
    )
    returning membro_id into v_membro_id;
  else
    update public.membros_equipe me
    set
      usuario_id = v_usuario_id,
      nome = v_nome,
      email = v_email,
      telefone = v_telefone,
      whatsapp = v_whatsapp,
      tipo_documento = v_tipo_documento,
      documento = v_documento,
      cep = v_cep,
      endereco = v_endereco,
      numero = v_numero,
      complemento = v_complemento,
      bairro = v_bairro,
      cidade = v_cidade,
      estado = v_estado,
      tipo_membro = p_tipo_membro,
      cargo = nullif(trim(p_cargo), ''),
      status = p_status,
      chave_pix = nullif(trim(p_chave_pix), ''),
      observacoes = nullif(trim(p_observacoes), '')
    where me.membro_id = v_membro_id
      and me.empresa_id = v_empresa_id;
  end if;


  return v_membro_id;
end;
$function$;


grant execute on function public.criar_membro_por_codigo(
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
