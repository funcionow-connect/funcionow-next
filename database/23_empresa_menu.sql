-- Registra o espaço da empresa no menu administrativo sem alterar dados existentes.
insert into public.paginas_sistema (pagina_key, nome, rota, ordem, ativo)
values ('empresa', 'Empresa', '/empresa', 2, true)
on conflict (pagina_key) do update
set nome = excluded.nome,
    rota = excluded.rota,
    ordem = excluded.ordem,
    ativo = true;

-- O espaço da empresa fica disponível para administração e suporte.
insert into public.perfil_acesso_permissoes (
  perfil_acesso_id,
  pagina_key,
  pode_acessar,
  pode_criar,
  pode_editar,
  pode_excluir
)
select
  pa.perfil_acesso_id,
  'empresa',
  true,
  true,
  true,
  false
from public.perfis_acesso pa
where pa.slug in ('admin', 'suporte')
on conflict (perfil_acesso_id, pagina_key) do update
set pode_acessar = true,
    pode_criar = true,
    pode_editar = true,
    pode_excluir = false;
