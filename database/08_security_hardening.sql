-- Funcionow Connect - hardening de acesso
-- Execute no SQL Editor do Supabase depois de revisar o projeto correto.

begin;

-- O usuário não deve alterar diretamente o próprio vínculo com empresa,
-- perfil legado ou perfil de acesso. Esses campos são controlados pelas
-- funções de administração/vínculo do banco.
drop policy if exists "usuarios_update_proprio" on public.usuarios;

commit;
