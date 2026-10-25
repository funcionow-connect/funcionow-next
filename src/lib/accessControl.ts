import { supabase } from "@/lib/supabaseClient";

export type AccessAction = "pode_acessar" | "pode_criar" | "pode_editar" | "pode_excluir";

type Permission = Record<AccessAction, boolean>;

export type ActiveCompanyContext = {
  userId: string;
  empresaId: string;
  perfilAcessoId: string | null;
  perfilLegado: string | null;
  papel: string | null;
};

const EMPTY_PERMISSION: Permission = {
  pode_acessar: false,
  pode_criar: false,
  pode_editar: false,
  pode_excluir: false,
};

function actionLabel(action: AccessAction) {
  if (action === "pode_criar") return "criar";
  if (action === "pode_editar") return "editar";
  if (action === "pode_excluir") return "excluir";
  return "acessar";
}

/** Resolve a empresa ativa e o perfil da associação atual do usuário. */
export async function getActiveCompanyContext(): Promise<ActiveCompanyContext | null> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return null;

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("empresa_id, empresa_ativa_id, perfil, perfil_acesso_id")
    .eq("usuario_id", userId)
    .maybeSingle<{
      empresa_id: string | null;
      empresa_ativa_id: string | null;
      perfil: string | null;
      perfil_acesso_id: string | null;
    }>();
  if (usuarioError || !usuario) return null;

  const { data: empresas, error: empresasError } = await supabase.rpc("listar_empresas_do_usuario");
  if (empresasError) return null;

  const empresaId = usuario.empresa_ativa_id || usuario.empresa_id;
  if (!empresaId) return null;

  const empresaAtiva = (empresas || []).find(
    (empresa: { empresa_id?: string; perfil_acesso_id?: string | null; papel?: string | null }) =>
      empresa.empresa_id === empresaId,
  );
  if (!empresaAtiva) return null;

  return {
    userId,
    empresaId,
    perfilAcessoId: empresaAtiva.perfil_acesso_id || usuario.perfil_acesso_id,
    perfilLegado: usuario.perfil,
    papel: empresaAtiva.papel || null,
  };
}

/**
 * Reads permissions from the active company's profile. This is deliberately
 * fail-closed: a missing link/profile or a Supabase read error never grants
 * an action by accident.
 */
export async function getActivePagePermission(paginaKey: string): Promise<Permission> {
  const contexto = await getActiveCompanyContext();
  const perfilAcessoId = contexto?.perfilAcessoId;
  if (!perfilAcessoId) return EMPTY_PERMISSION;

  const { data, error } = await supabase
    .from("perfil_acesso_permissoes")
    .select("pode_acessar, pode_criar, pode_editar, pode_excluir")
    .eq("perfil_acesso_id", perfilAcessoId)
    .eq("pagina_key", paginaKey)
    .maybeSingle<Permission>();

  if (error || !data) return EMPTY_PERMISSION;
  return {
    pode_acessar: Boolean(data.pode_acessar),
    pode_criar: Boolean(data.pode_criar),
    pode_editar: Boolean(data.pode_editar),
    pode_excluir: Boolean(data.pode_excluir),
  };
}

export async function requirePagePermission(
  paginaKey: string,
  action: AccessAction,
): Promise<boolean> {
  const permission = await getActivePagePermission(paginaKey);
  const allowed = permission.pode_acessar && permission[action];
  if (!allowed && typeof window !== "undefined") {
    window.alert(`Seu perfil não tem permissão para ${actionLabel(action)} nesta área.`);
  }
  return allowed;
}
