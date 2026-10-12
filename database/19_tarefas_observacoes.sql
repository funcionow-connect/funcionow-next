-- Observações livres para registrar contexto, bloqueios e atualizações das tarefas.
alter table if exists public.tarefas
  add column if not exists observacoes text null;

grant select, insert, update, delete on public.tarefas to authenticated;
grant select, insert, update, delete on public.tarefas to service_role;
