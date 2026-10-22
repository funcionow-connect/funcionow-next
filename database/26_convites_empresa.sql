-- Convites de acesso por empresa, sem duplicar contas existentes.
create table if not exists public.convites_empresa (
  convite_id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  empresa_id uuid not null references public.empresas(empresa_id) on delete cascade,
  perfil_acesso_id uuid references public.perfis_acesso(perfil_acesso_id) on delete set null,
  destinatario_email text,
  status text not null default 'pendente' check (status in ('pendente','aceito','cancelado','expirado')),
  criado_por uuid references auth.users(id) on delete set null,
  aceito_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '14 days'),
  aceito_em timestamptz
);

create index if not exists idx_convites_empresa_codigo on public.convites_empresa(codigo);
create index if not exists idx_convites_empresa_empresa on public.convites_empresa(empresa_id);
alter table public.convites_empresa enable row level security;

create or replace function public.criar_convite_empresa(
  p_email text default null,
  p_perfil_slug text default 'operacional'
)
returns table (codigo text, empresa_id uuid, empresa_nome text, perfil_nome text)
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_empresa_id uuid;
  v_perfil_id uuid;
  v_codigo text;
  v_nome_empresa text;
  v_nome_perfil text;
  v_email text := nullif(lower(trim(p_email)), '');
begin
  select coalesce(u.empresa_ativa_id, u.empresa_id) into v_empresa_id
  from public.usuarios u where u.usuario_id = auth.uid() and u.perfil = 'admin' limit 1;
  if v_empresa_id is null then raise exception 'Apenas administradores podem gerar convites.'; end if;

  select pa.perfil_acesso_id, pa.nome into v_perfil_id, v_nome_perfil
  from public.perfis_acesso pa
  where pa.empresa_id = v_empresa_id and pa.slug = coalesce(nullif(trim(p_perfil_slug), ''), 'operacional') and pa.ativo = true limit 1;
  if v_perfil_id is null then raise exception 'Perfil de acesso não encontrado para esta empresa.'; end if;

  select e.nome into v_nome_empresa from public.empresas e where e.empresa_id = v_empresa_id;
  loop
    v_codigo := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 12));
    exit when not exists (select 1 from public.convites_empresa c where c.codigo = v_codigo);
  end loop;

  insert into public.convites_empresa(codigo, empresa_id, perfil_acesso_id, destinatario_email, criado_por)
  values (v_codigo, v_empresa_id, v_perfil_id, v_email, auth.uid());
  return query select v_codigo, v_empresa_id, v_nome_empresa, v_nome_perfil;
end;
$$;

grant execute on function public.criar_convite_empresa(text, text) to authenticated;

create or replace function public.consultar_convite_empresa(p_codigo text)
returns table (codigo text, empresa_id uuid, empresa_nome text, perfil_nome text, destinatario_email text, status text, expira_em timestamptz)
language sql security definer set search_path = public
as $$
  select c.codigo, c.empresa_id, e.nome, pa.nome, c.destinatario_email,
         case when c.status = 'pendente' and c.expira_em < now() then 'expirado' else c.status end,
         c.expira_em
  from public.convites_empresa c
  join public.empresas e on e.empresa_id = c.empresa_id
  left join public.perfis_acesso pa on pa.perfil_acesso_id = c.perfil_acesso_id
  where c.codigo = upper(trim(p_codigo)) limit 1;
$$;

grant execute on function public.consultar_convite_empresa(text) to anon, authenticated;

create or replace function public.aceitar_convite_empresa(p_codigo text)
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_convite public.convites_empresa%rowtype;
  v_email text;
  v_nome text;
  v_existing_empresa uuid;
begin
  select * into v_convite from public.convites_empresa
  where codigo = upper(trim(p_codigo)) limit 1;
  if not found then raise exception 'Convite não encontrado.'; end if;
  if v_convite.status <> 'pendente' or v_convite.expira_em < now() then raise exception 'Este convite expirou ou já foi utilizado.'; end if;

  select lower(email), coalesce(raw_user_meta_data->>'nome', split_part(email, '@', 1)) into v_email, v_nome from auth.users where id = auth.uid();
  if v_email is null then raise exception 'Sessão de usuário não encontrada.'; end if;
  if v_convite.destinatario_email is not null and lower(v_convite.destinatario_email) <> v_email then raise exception 'Este convite foi destinado a outro e-mail.'; end if;

  insert into public.usuario_empresas(usuario_id, empresa_id, perfil_acesso_id, papel, status, empresa_padrao)
  values (auth.uid(), v_convite.empresa_id, v_convite.perfil_acesso_id, 'membro', 'ativo', false)
  on conflict (usuario_id, empresa_id) do update set perfil_acesso_id = excluded.perfil_acesso_id, status = 'ativo';

  select empresa_id into v_existing_empresa from public.usuarios where usuario_id = auth.uid();
  if v_existing_empresa is null then
    insert into public.usuarios(usuario_id, empresa_id, empresa_ativa_id, perfil_acesso_id, perfil, nome, email, status)
    values (auth.uid(), v_convite.empresa_id, v_convite.empresa_id, v_convite.perfil_acesso_id, 'suporte', v_nome, v_email, 'ativo');
  else
    update public.usuarios set empresa_ativa_id = v_convite.empresa_id, atualizado_em = now() where usuario_id = auth.uid();
  end if;

  insert into public.membros_equipe(empresa_id, usuario_id, nome, tipo_membro, status, email)
  values (v_convite.empresa_id, auth.uid(), v_nome, 'colaborador', 'ativo', v_email)
  on conflict do nothing;

  update public.convites_empresa set status = 'aceito', aceito_por = auth.uid(), aceito_em = now() where convite_id = v_convite.convite_id;
end;
$$;

grant execute on function public.aceitar_convite_empresa(text) to authenticated;
