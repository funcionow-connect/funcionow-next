-- =========================================================
-- Funcionow Connect - Supabase mirror
-- File: 05_triggers.sql
-- Purpose: current public triggers
-- Generated from current Supabase project state.
-- =========================================================

drop trigger if exists trg_creator_captacao_set_atualizado_em on public.creator_captacao;
create trigger trg_creator_captacao_set_atualizado_em
before update on public.creator_captacao
for each row
execute function public.set_atualizado_em();

drop trigger if exists trg_tipo_creator on public.creator_captacao;
create trigger trg_tipo_creator
before insert or update on public.creator_captacao
for each row
execute function public.fn_calcular_tipo_creator();

drop trigger if exists trg_membros_equipe_set_atualizado_em on public.membros_equipe;
create trigger trg_membros_equipe_set_atualizado_em
before update on public.membros_equipe
for each row
execute function public.set_atualizado_em();
