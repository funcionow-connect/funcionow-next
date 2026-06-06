-- =====================================================
-- FUNCTIONS
-- =====================================================

-- FUNCTION: handle_new_user
-- Cria perfil pessoal, empresa, perfis de acesso, permissões padrão
-- e usuário admin quando um novo usuário é criado no Supabase Auth.


-- FUNCTION: gerar_codigo_vinculo_usuario
-- Gera código único de vínculo para usuários e equipes.

-- FUNCTION: salvar_avaliacao_creator
-- Salva avaliação, respostas dos critérios, calcula score normalizado
-- e atualiza status do creator como aprovado, potencial ou reprovado.

-- FUNCTION: fn_calcular_tipo_creator
-- Define automaticamente:
-- nano, micro, meso, macro ou mega
-- com base na quantidade de seguidores.

-- FUNCTION: vincular_membro_por_codigo
-- Vincula um usuário existente à empresa através de um código
-- de vínculo e atualiza o membro da equipe correspondente.

-- FUNCTION: criar_membro_por_codigo
-- Cria ou atualiza um membro da equipe utilizando o código
-- de vínculo de um usuário já cadastrado na plataforma.

