-- Grants explícitos para tabelas de campanhas expostas pela Data API.
-- Mantém o acesso compatível com projetos existentes e futuros resets.

begin;

grant select on public.campanhas, public.campanha_creators, public.campanha_entregaveis to anon;
grant select, insert, update, delete on public.campanhas, public.campanha_creators, public.campanha_entregaveis to authenticated;
grant select, insert, update, delete on public.campanhas, public.campanha_creators, public.campanha_entregaveis to service_role;

commit;
