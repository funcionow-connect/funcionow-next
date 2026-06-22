-- =========================================================
-- Funcionow Connect
-- Multiempresa por usuário
-- Data: 2026-06-21
-- =========================================================

CREATE TABLE IF NOT EXISTS public.usuario_empresas (
  usuario_empresa_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(empresa_id) ON DELETE CASCADE,
  perfil_acesso_id uuid REFERENCES public.perfis_acesso(perfil_acesso_id) ON DELETE SET NULL,
  papel text DEFAULT 'membro',
  status text NOT NULL DEFAULT 'ativo',
  empresa_padrao boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT usuario_empresas_usuario_empresa_unique UNIQUE (usuario_id, empresa_id),
  CONSTRAINT usuario_empresas_status_check CHECK (status IN ('ativo', 'inativo', 'pendente')),
  CONSTRAINT usuario_empresas_papel_check CHECK (papel IN ('owner', 'admin', 'gestor', 'operacional', 'terceirizado', 'membro'))
);

ALTER TABLE public.usuario_empresas ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_usuario_empresas_usuario_id
ON public.usuario_empresas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_usuario_empresas_empresa_id
ON public.usuario_empresas(empresa_id);

ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS empresa_ativa_id uuid;

UPDATE public.usuarios
SET empresa_ativa_id = empresa_id
WHERE empresa_ativa_id IS NULL;

INSERT INTO public.usuario_empresas (
  usuario_id,
  empresa_id,
  perfil_acesso_id,
  papel,
  status,
  empresa_padrao
)
SELECT
  u.usuario_id,
  u.empresa_id,
  u.perfil_acesso_id,
  CASE
    WHEN u.perfil = 'admin' THEN 'admin'
    WHEN u.perfil = 'suporte' THEN 'gestor'
    WHEN u.perfil = 'terceirizado' THEN 'terceirizado'
    ELSE 'membro'
  END AS papel,
  'ativo' AS status,
  true AS empresa_padrao
FROM public.usuarios u
WHERE u.empresa_id IS NOT NULL
ON CONFLICT (usuario_id, empresa_id) DO UPDATE
SET
  perfil_acesso_id = EXCLUDED.perfil_acesso_id,
  papel = EXCLUDED.papel,
  status = EXCLUDED.status,
  empresa_padrao = EXCLUDED.empresa_padrao,
  atualizado_em = now();

CREATE OR REPLACE FUNCTION public.trocar_empresa_ativa(p_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.usuario_empresas ue
    WHERE ue.usuario_id = auth.uid()
      AND ue.empresa_id = p_empresa_id
      AND ue.status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Usuário não tem acesso ativo a esta empresa.';
  END IF;

  UPDATE public.usuarios
  SET empresa_ativa_id = p_empresa_id
  WHERE usuario_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.trocar_empresa_ativa(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.listar_empresas_do_usuario()
RETURNS TABLE (
  empresa_id uuid,
  nome text,
  segmento text,
  papel text,
  perfil_acesso_id uuid,
  empresa_padrao boolean,
  empresa_ativa boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.empresa_id,
    e.nome,
    e.segmento,
    ue.papel,
    ue.perfil_acesso_id,
    ue.empresa_padrao,
    u.empresa_ativa_id = e.empresa_id AS empresa_ativa
  FROM public.usuario_empresas ue
  JOIN public.empresas e ON e.empresa_id = ue.empresa_id
  JOIN public.usuarios u ON u.usuario_id = ue.usuario_id
  WHERE ue.usuario_id = auth.uid()
    AND ue.status = 'ativo'
  ORDER BY
    empresa_ativa DESC,
    ue.empresa_padrao DESC,
    e.nome ASC;
$$;

GRANT EXECUTE ON FUNCTION public.listar_empresas_do_usuario() TO authenticated;