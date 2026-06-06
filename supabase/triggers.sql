-- =====================================================
-- TRIGGERS
-- =====================================================

-- creator_captacao: atualiza atualizado_em antes de UPDATE
-- trg_creator_captacao_set_atualizado_em
-- BEFORE UPDATE ON creator_captacao
-- EXECUTE FUNCTION set_atualizado_em()

-- creator_captacao: calcula tipo_creator antes de INSERT
-- trg_tipo_creator
-- BEFORE INSERT ON creator_captacao
-- EXECUTE FUNCTION fn_calcular_tipo_creator()

-- creator_captacao: recalcula tipo_creator antes de UPDATE
-- trg_tipo_creator
-- BEFORE UPDATE ON creator_captacao
-- EXECUTE FUNCTION fn_calcular_tipo_creator()

-- membros_equipe: atualiza atualizado_em antes de UPDATE
-- trg_membros_equipe_set_atualizado_em
-- BEFORE UPDATE ON membros_equipe
-- EXECUTE FUNCTION set_atualizado_em()

-- perfis_usuario: atualiza atualizado_em antes de UPDATE
-- trg_perfis_usuario_set_atualizado_em
-- BEFORE UPDATE ON perfis_usuario
-- EXECUTE FUNCTION set_atualizado_em()