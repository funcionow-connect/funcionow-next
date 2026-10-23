-- Verifica se um e-mail possui conta antes de iniciar a recuperação.
-- Esta função é usada apenas na tela pública de recuperação.
create or replace function public.email_tem_conta(p_email text)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.email_tem_conta(text) from public;
grant execute on function public.email_tem_conta(text) to anon, authenticated;

