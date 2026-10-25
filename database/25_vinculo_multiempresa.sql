-- Funcionow Connect
-- Permite vincular uma conta existente a mais de uma empresa sem apagar o vínculo original.
-- Migration idempotente e compatível com o modelo legado de public.usuarios.

create or replace function public.trocar_empresa_ativa(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_perfil_acesso_id uuid;
  v_papel text;
  v_perfil text;
begin
  select ue.perfil_acesso_id, ue.papel
  into v_perfil_acesso_id, v_papel
  from public.usuario_empresas ue
  where ue.usuario_id = auth.uid()
    and ue.empresa_id = p_empresa_id
    and ue.status = 'ativo'
  limit 1;

  if not found then
    raise exception 'Usuário não tem acesso ativo a esta empresa.';
  end if;

  v_perfil := case
    when v_papel in ('owner', 'admin') then 'admin'
    when v_papel = 'terceirizado' then 'terceirizado'
    else 'suporte'
  end;

  update public.usuarios
  set empresa_ativa_id = p_empresa_id,
      empresa_id = p_empresa_id,
      perfil_acesso_id = coalesce(v_perfil_acesso_id, perfil_acesso_id),
      perfil = v_perfil
  where usuario_id = auth.uid();

  if not found then
    raise exception 'Perfil do usuário não encontrado.';
  end if;
end;
$$;

grant execute on function public.trocar_empresa_ativa(uuid) to authenticated;

create or replace function public.criar_membro_multiempresa_por_codigo(
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
as $$
declare
  v_empresa_id uuid;
  v_usuario_id uuid;
  v_nome text;
  v_email text;
  v_telefone text;
  v_whatsapp text;
  v_tipo_documento text;
  v_documento text;
  v_membro_id uuid;
  v_perfil_acesso_id uuid;
  v_slug_perfil text;
  v_papel text;
begin
  if p_tipo_membro not in ('colaborador', 'terceirizado') then
    raise exception 'Tipo de relacionamento inválido. Use colaborador ou terceirizado.';
  end if;

  if p_perfil not in ('admin', 'suporte', 'terceirizado') then
    raise exception 'Perfil inválido. Use admin, suporte ou terceirizado.';
  end if;

  if p_status not in ('ativo', 'inativo') then
    raise exception 'Status inválido. Use ativo ou inativo.';
  end if;

  select coalesce(u.empresa_ativa_id, u.empresa_id)
  into v_empresa_id
  from public.usuarios u
  where u.usuario_id = auth.uid()
    and u.perfil = 'admin'
  limit 1;

  if v_empresa_id is null then
    raise exception 'Usuário logado não possui empresa vinculada ou não é admin.';
  end if;

  select pu.usuario_id, pu.nome, pu.email, pu.telefone, pu.whatsapp,
         pu.tipo_documento, pu.documento
  into v_usuario_id, v_nome, v_email, v_telefone, v_whatsapp,
       v_tipo_documento, v_documento
  from public.perfis_usuario pu
  where pu.codigo_vinculo = upper(trim(p_codigo_vinculo))
  limit 1;

  if v_usuario_id is null then
    raise exception 'Código de vínculo não encontrado.';
  end if;

  v_slug_perfil := case
    when p_perfil = 'admin' then 'admin'
    when p_perfil = 'terceirizado' then 'externo'
    else 'operacional'
  end;

  v_papel := case
    when p_perfil = 'admin' then 'admin'
    when p_perfil = 'terceirizado' then 'terceirizado'
    else 'membro'
  end;

  select pa.perfil_acesso_id
  into v_perfil_acesso_id
  from public.perfis_acesso pa
  where pa.empresa_id = v_empresa_id
    and pa.slug = v_slug_perfil
  limit 1;

  if v_perfil_acesso_id is null then
    raise exception 'Perfil de acesso padrão não encontrado para esta empresa.';
  end if;

  insert into public.usuario_empresas (
    usuario_id, empresa_id, perfil_acesso_id, papel, status, empresa_padrao
  ) values (
    v_usuario_id, v_empresa_id, v_perfil_acesso_id, v_papel, 'ativo', false
  )
  on conflict (usuario_id, empresa_id) do update set
    perfil_acesso_id = excluded.perfil_acesso_id,
    papel = excluded.papel,
    status = excluded.status,
    atualizado_em = now();

  -- Mantém o contexto legado sem sobrescrever a empresa atual de uma conta existente.
  insert into public.usuarios (
    usuario_id, empresa_id, nome, email, perfil, perfil_acesso_id, status, empresa_ativa_id
  ) values (
    v_usuario_id, v_empresa_id, v_nome, v_email, p_perfil, v_perfil_acesso_id, 'ativo', v_empresa_id
  )
  on conflict (usuario_id) do update set
    nome = excluded.nome,
    email = excluded.email,
    status = 'ativo'
  where public.usuarios.empresa_id = excluded.empresa_id;

  select me.membro_id
  into v_membro_id
  from public.membros_equipe me
  where me.empresa_id = v_empresa_id
    and (me.usuario_id = v_usuario_id or lower(coalesce(me.email, '')) = lower(v_email))
  limit 1;

  if v_membro_id is null then
    insert into public.membros_equipe (
      empresa_id, usuario_id, nome, tipo_membro, cargo, status, email,
      telefone, whatsapp, tipo_documento, documento, chave_pix, observacoes
    ) values (
      v_empresa_id, v_usuario_id, v_nome, p_tipo_membro, nullif(trim(p_cargo), ''), p_status, v_email,
      v_telefone, v_whatsapp, v_tipo_documento, v_documento,
      nullif(trim(p_chave_pix), ''), nullif(trim(p_observacoes), '')
    ) returning membro_id into v_membro_id;
  else
    update public.membros_equipe
    set usuario_id = v_usuario_id,
        nome = v_nome,
        email = v_email,
        tipo_membro = p_tipo_membro,
        cargo = nullif(trim(p_cargo), ''),
        status = p_status,
        observacoes = nullif(trim(p_observacoes), '')
    where membro_id = v_membro_id and empresa_id = v_empresa_id;
  end if;

  return v_membro_id;
end;
$$;

grant execute on function public.criar_membro_multiempresa_por_codigo(text, text, text, text, text, text, text) to authenticated;
