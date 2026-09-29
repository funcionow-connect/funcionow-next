-- Atualiza os nomes exibidos no menu dinâmico de permissões.
begin;

update public.paginas_sistema set nome = 'Academia' where pagina_key = 'academy';
update public.paginas_sistema set nome = 'Recompensas' where pagina_key = 'rewards';
update public.paginas_sistema set nome = 'Comunidade' where pagina_key = 'community';
update public.paginas_sistema set nome = 'Análises de IA' where pagina_key = 'insights';

commit;
