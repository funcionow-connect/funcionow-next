-- =========================================================
-- Contexto ativo multiempresa
-- Mantém o modelo legado sincronizado com a empresa selecionada.
-- =========================================================

create or replace function public.trocar_empresa_ativa(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_perfil_acesso_id uuid;
  v_papel text;
  v_perfil_legado text;
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

  v_perfil_legado := case
    when v_papel in ('owner', 'admin') then 'admin'
    when v_papel in ('gestor', 'operacional') then 'suporte'
    when v_papel = 'terceirizado' then 'terceirizado'
    else 'suporte'
  end;

  update public.usuarios
  set
    empresa_id = p_empresa_id,
    empresa_ativa_id = p_empresa_id,
    perfil_acesso_id = v_perfil_acesso_id,
    perfil = v_perfil_legado
  where usuario_id = auth.uid();
end;
$function$;

grant execute on function public.trocar_empresa_ativa(uuid) to authenticated;
