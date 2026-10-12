-- O criador da reunião também participa automaticamente.
alter table public.reuniao_participantes
  add column if not exists usuario_id uuid null references public.usuarios(usuario_id) on delete cascade;

alter table public.reuniao_participantes
  alter column membro_id drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reuniao_participantes_membro_ou_usuario_check') then
    alter table public.reuniao_participantes
      add constraint reuniao_participantes_membro_ou_usuario_check
      check (membro_id is not null or usuario_id is not null);
  end if;
end $$;

insert into public.reuniao_participantes (empresa_id, reuniao_id, usuario_id)
select r.empresa_id, r.reuniao_id, r.criado_por
from public.reunioes r
where r.criado_por is not null
  and not exists (
    select 1 from public.reuniao_participantes rp
    where rp.reuniao_id = r.reuniao_id
      and rp.usuario_id = r.criado_por
  );

grant select, insert, update, delete on public.reuniao_participantes to authenticated;
grant select, insert, update, delete on public.reuniao_participantes to service_role;
