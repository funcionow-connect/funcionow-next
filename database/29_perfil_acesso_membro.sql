-- =========================================================
-- Funcionow Connect
-- Leitura segura do perfil de acesso de um membro da empresa ativa
-- =========================================================

create or replace function public.buscar_perfil_acesso_membro(
  p_membro_id uuid
)
returns table (
  perfil_acesso_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_empresa_id uuid;
  v_usuario_membro uuid;
begin
  select coalesce(u.empresa_ativa_id, u.empresa_id)
  into v_empresa_id
  from public.usuarios u
  where u.usuario_id = auth.uid()
    and u.perfil = 'admin'
    and exists (
      select 1
      from public.usuario_empresas ue
      where ue.usuario_id = auth.uid()
        and ue.empresa_id = coalesce(u.empresa_ativa_id, u.empresa_id)
        and ue.status = 'ativo'
    )
  limit 1;

  if v_empresa_id is null then
    raise exception 'Usuário não tem permissão para consultar este perfil.';
  end if;

  select me.usuario_id
  into v_usuario_membro
  from public.membros_equipe me
  where me.membro_id = p_membro_id
    and me.empresa_id = v_empresa_id
  limit 1;

  if v_usuario_membro is null then
    raise exception 'Membro não encontrado nesta empresa.';
  end if;

  return query
  select ue.perfil_acesso_id
  from public.usuario_empresas ue
  where ue.usuario_id = v_usuario_membro
    and ue.empresa_id = v_empresa_id
    and ue.status = 'ativo'
  limit 1;
end;
$function$;

grant execute on function public.buscar_perfil_acesso_membro(uuid) to authenticated;

-- Mantém o vínculo multiempresa sincronizado quando o administrador altera
-- o perfil pela tela de equipe. O campo legado em usuarios continua atualizado
-- para preservar a compatibilidade com as telas antigas.
create or replace function public.atualizar_perfil_acesso_membro(
  p_membro_id uuid,
  p_perfil_acesso_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_empresa_admin uuid;
  v_usuario_membro uuid;
  v_perfil_slug text;
begin
  select coalesce(u.empresa_ativa_id, u.empresa_id)
  into v_empresa_admin
  from public.usuarios u
  where u.usuario_id = auth.uid()
    and u.perfil = 'admin'
    and exists (
      select 1
      from public.usuario_empresas ue
      where ue.usuario_id = auth.uid()
        and ue.empresa_id = coalesce(u.empresa_ativa_id, u.empresa_id)
        and ue.status = 'ativo'
    )
  limit 1;

  if v_empresa_admin is null then
    raise exception 'Apenas administradores podem alterar perfil de acesso.';
  end if;

  select me.usuario_id
  into v_usuario_membro
  from public.membros_equipe me
  where me.membro_id = p_membro_id
    and me.empresa_id = v_empresa_admin
  limit 1;

  if v_usuario_membro is null then
    raise exception 'Membro não encontrado ou ainda sem usuário vinculado.';
  end if;

  select pa.slug
  into v_perfil_slug
  from public.perfis_acesso pa
  where pa.perfil_acesso_id = p_perfil_acesso_id
    and pa.empresa_id = v_empresa_admin
    and pa.ativo = true
  limit 1;

  if v_perfil_slug is null then
    raise exception 'Perfil de acesso não encontrado para esta empresa.';
  end if;

  update public.usuario_empresas ue
  set
    perfil_acesso_id = p_perfil_acesso_id,
    papel = case
      when v_perfil_slug = 'admin' then 'admin'
      when v_perfil_slug = 'operacional' then 'operacional'
      when v_perfil_slug = 'externo' then 'terceirizado'
      else ue.papel
    end,
    atualizado_em = now()
  where ue.usuario_id = v_usuario_membro
    and ue.empresa_id = v_empresa_admin;

  update public.usuarios u
  set
    perfil_acesso_id = p_perfil_acesso_id,
    perfil = case
      when v_perfil_slug = 'admin' then 'admin'
      when v_perfil_slug = 'operacional' then 'suporte'
      when v_perfil_slug = 'externo' then 'terceirizado'
      else coalesce(u.perfil, 'suporte')
    end
  where u.usuario_id = v_usuario_membro
    and u.empresa_id = v_empresa_admin;
end;
$function$;

grant execute on function public.atualizar_perfil_acesso_membro(uuid, uuid) to authenticated;
