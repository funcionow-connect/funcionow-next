-- Permite promover um creator a speaker sem duplicar a pessoa ou perder histórico.
begin;

alter table public.speakers
  add column if not exists creator_id uuid references public.creators(creator_id) on delete set null;

create unique index if not exists idx_speakers_creator_unique
  on public.speakers (creator_id)
  where creator_id is not null;

commit;
