"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UsuarioVinculo = {
  empresa_id: string;
  perfil: string | null;
  perfil_acesso_id: string | null;
};

type PerfilAcesso = {
  nome: string;
  slug: string;
  is_admin: boolean;
};

type PaginaSistema = {
  pagina_key: string;
  nome: string;
  rota: string;
  ordem: number;
  ativo: boolean;
};

type PermissaoPagina = {
  pagina_key: string;
  pode_acessar: boolean;
  paginas_sistema: PaginaSistema | PaginaSistema[] | null;
};

type MenuItem = {
  label: string;
  href: string;
  match: string;
  ordem: number;
};

const fallbackMenuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", match: "/dashboard", ordem: 1 },
  { label: "Creators", href: "/creators", match: "/creators", ordem: 2 },
  { label: "Avaliações", href: "/avaliacoes", match: "/avaliacoes", ordem: 3 },
  { label: "Campanhas", href: "/campanhas", match: "/campanhas", ordem: 4 },
  { label: "Academy", href: "/academy", match: "/academy", ordem: 5 },
  { label: "Rewards", href: "/rewards", match: "/rewards", ordem: 6 },
  { label: "Community", href: "/community", match: "/community", ordem: 7 },
  { label: "IA Insights", href: "/insights", match: "/insights", ordem: 8 },
  { label: "Equipe", href: "/equipe", match: "/equipe", ordem: 9 },
  {
    label: "Configurações",
    href: "/configuracoes",
    match: "/configuracoes",
    ordem: 10,
  },
  { label: "Meu Perfil", href: "/perfil", match: "/perfil", ordem: 99 },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [temEmpresa, setTemEmpresa] = useState(false);
  const [perfilAcessoNome, setPerfilAcessoNome] = useState("");
  const [initials, setInitials] = useState("U");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          window.location.href = "/";
          return;
        }

        const { data: usuario, error } = await supabase
          .from("usuarios")
          .select("empresa_id, perfil, perfil_acesso_id")
          .eq("usuario_id", session.user.id)
          .maybeSingle<UsuarioVinculo>();

        const { data: perfilUsuario } = await supabase
          .from("perfis_usuario")
          .select("nome")
          .eq("usuario_id", session.user.id)
          .maybeSingle<{ nome: string }>();

        setInitials(
          getInitials(perfilUsuario?.nome || session.user.email || "U"),
        );

        const rotaLivreParaSemEmpresa =
          pathname === "/perfil" || pathname.startsWith("/perfil/");

        if (error) {
          console.error("Erro ao verificar vínculo:", error);
          setTemEmpresa(false);
          setMenuItems([]);

          if (!rotaLivreParaSemEmpresa) {
            window.location.href = "/perfil";
            return;
          }

          return;
        }

        if (!usuario?.empresa_id) {
          setTemEmpresa(false);
          setMenuItems([]);
          setPerfilAcessoNome("");

          if (!rotaLivreParaSemEmpresa) {
            window.location.href = "/perfil";
            return;
          }

          return;
        }

        setTemEmpresa(true);

        let itensPermitidos: MenuItem[] = [];
        let nomePerfil = "";

        if (usuario.perfil_acesso_id) {
          const { data: perfilAcesso, error: perfilError } = await supabase
            .from("perfis_acesso")
            .select("nome, slug, is_admin")
            .eq("perfil_acesso_id", usuario.perfil_acesso_id)
            .maybeSingle<PerfilAcesso>();

          if (perfilError) {
            console.error("Erro ao buscar perfil de acesso:", perfilError);
          }

          nomePerfil = perfilAcesso?.nome || "";

          const { data: permissoes, error: permissoesError } = await supabase
            .from("perfil_acesso_permissoes")
            .select(
              "pagina_key, pode_acessar, paginas_sistema(pagina_key, nome, rota, ordem, ativo)",
            )
            .eq("perfil_acesso_id", usuario.perfil_acesso_id)
            .eq("pode_acessar", true);

          if (permissoesError) {
            console.error("Erro ao buscar permissões:", permissoesError);
          } else {
            itensPermitidos = ((permissoes || []) as PermissaoPagina[])
              .map((permissao) => {
                const pagina = Array.isArray(permissao.paginas_sistema)
                  ? permissao.paginas_sistema[0]
                  : permissao.paginas_sistema;

                if (!pagina || !pagina.ativo) return null;

                return {
                  label: pagina.nome,
                  href: pagina.rota,
                  match: pagina.rota,
                  ordem: pagina.ordem,
                };
              })
              .filter(Boolean) as MenuItem[];

            itensPermitidos.sort((a, b) => a.ordem - b.ordem);
          }
        }

        // Fallback temporário para usuários antigos ou recém-criados sem perfil_acesso_id
        if (itensPermitidos.length === 0) {
          itensPermitidos = getFallbackMenuByPerfil(usuario.perfil);
          nomePerfil = formatPerfilAntigo(usuario.perfil);
        }

        const jaTemPerfil = itensPermitidos.some(
          (item) => item.href === "/perfil",
        );

        if (!jaTemPerfil) {
          itensPermitidos.push({
            label: "Meu Perfil",
            href: "/perfil",
            match: "/perfil",
            ordem: 99,
          });

          itensPermitidos.sort((a, b) => a.ordem - b.ordem);
        }

        setMenuItems(itensPermitidos);
        setPerfilAcessoNome(nomePerfil);

        const rotaPerfil =
          pathname === "/perfil" || pathname.startsWith("/perfil/");

        const rotaPermitida =
          rotaPerfil ||
          itensPermitidos.some((item) => {
            return pathname === item.href || pathname.startsWith(`${item.match}/`);
          });

        if (!rotaPermitida) {
          const rotaDestino =
            itensPermitidos.find((item) => item.href === "/dashboard")?.href ||
            itensPermitidos.find((item) => item.href === "/perfil")?.href ||
            "/perfil";

          window.location.href = rotaDestino;
          return;
        }
      } catch (err) {
        console.error("Erro inesperado ao verificar acesso:", err);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div style={loadingPage}>
        <div style={loadingCard}>
          <div style={brandMark} />
          <div>
            <div style={loadingTitle}>Funcionow Connect</div>
            <div style={loadingText}>Carregando sua plataforma...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <aside style={sidebar}>
        <div>
          <div style={brandBox}>
            <div style={brandMark} />
            <div>
              <h2 style={brandTitle}>Funcionow</h2>
              <div style={brandSubtitle}>Connect</div>
            </div>
          </div>

          <nav style={nav}>
            {temEmpresa ? (
              <>
                {menuItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.match}/`);

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      style={active ? navItemActiveStyle : navItemStyle}
                    >
                      <span>{item.label}</span>
                    </a>
                  );
                })}

                <div style={profileInfoBox}>
                  <span style={infoLabel}>Perfil de acesso</span>
                  <strong style={infoValue}>
                    {perfilAcessoNome || "Não definido"}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <a
                  href="/perfil"
                  style={
                    pathname.startsWith("/perfil")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Meu Perfil
                </a>

                <div style={infoBox}>
                  Você ainda não está vinculado a uma empresa.
                </div>
              </>
            )}
          </nav>
        </div>

        <button onClick={handleLogout} style={logoutButton}>
          Sair
        </button>
      </aside>

      <div style={contentArea}>
        <header style={topbar}>
          <div style={topbarGlow} />
          <div style={avatar}>{initials}</div>
        </header>

        <main style={main}>
          <div style={mainInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getFallbackMenuByPerfil = (perfil: string | null): MenuItem[] => {
  if (perfil === "admin") {
    return fallbackMenuItems;
  }

  if (perfil === "suporte") {
    return fallbackMenuItems.filter((item) =>
      ["/dashboard", "/creators", "/avaliacoes", "/campanhas", "/perfil"].includes(
        item.href,
      ),
    );
  }

  if (perfil === "terceirizado") {
    return fallbackMenuItems.filter((item) =>
      ["/dashboard", "/creators", "/avaliacoes", "/perfil"].includes(item.href),
    );
  }

  return fallbackMenuItems.filter((item) => item.href === "/perfil");
};

const formatPerfilAntigo = (perfil: string | null) => {
  if (perfil === "admin") return "Administrador";
  if (perfil === "suporte") return "Gestor";
  if (perfil === "terceirizado") return "Colaborador externo";
  return "Não definido";
};

const shell = {
  display: "flex",
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(139,108,248,0.10), transparent 32%), var(--fc-bg)",
};

const sidebar = {
  width: "240px",
  background:
    "linear-gradient(180deg, var(--fc-sidebar) 0%, #0b0b12 100%)",
  color: "white",
  padding: "18px 14px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "12px 0 40px rgba(17,17,26,0.10)",
};

const brandBox = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "26px",
  padding: "0 8px",
};

const brandMark = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--fc-lime) 0%, var(--fc-purple) 100%)",
  boxShadow: "0 0 24px rgba(198,255,0,0.35)",
  flexShrink: 0,
};

const brandTitle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 800,
  letterSpacing: "-0.04em",
  lineHeight: 1,
};

const brandSubtitle = {
  marginTop: "3px",
  fontSize: "11px",
  fontWeight: 700,
  color: "rgba(198,255,0,0.85)",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const nav = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
};

const navItemStyle = {
  padding: "10px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.66)",
  cursor: "pointer",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid transparent",
  transition: "all 180ms ease",
};

const navItemActiveStyle = {
  padding: "10px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  color: "#111111",
  background: "var(--fc-lime)",
  cursor: "pointer",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid rgba(198,255,0,0.9)",
  boxShadow: "0 10px 28px rgba(198,255,0,0.22)",
  fontWeight: 800,
};

const logoutButton = {
  padding: "10px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.62)",
  cursor: "pointer",
  textDecoration: "none",
  display: "block",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.08)",
  textAlign: "left" as const,
};

const contentArea = {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  minWidth: 0,
};

const topbar = {
  height: "68px",
  background: "rgba(248,248,252,0.82)",
  backdropFilter: "blur(18px)",
  borderBottom: "1px solid rgba(229,231,235,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0 28px",
  position: "sticky" as const,
  top: 0,
  zIndex: 10,
};

const topbarGlow = {
  width: "120px",
  height: "24px",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, rgba(139,108,248,0.16), rgba(198,255,0,0.18))",
  filter: "blur(16px)",
  marginRight: "12px",
};

const avatar = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--fc-purple) 0%, var(--fc-purple-dark) 100%)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 800,
  boxShadow: "0 10px 24px rgba(139,108,248,0.25)",
};

const main = {
  flex: 1,
  padding: "26px",
};

const mainInner = {
  maxWidth: "1220px",
  margin: "0 auto",
};

const loadingPage = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(139,108,248,0.16), transparent 32%), var(--fc-bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--fc-muted)",
  fontSize: "13px",
};

const loadingCard = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "white",
  border: "1px solid var(--fc-border)",
  borderRadius: "24px",
  padding: "16px 18px",
  boxShadow: "var(--fc-shadow-soft)",
};

const loadingTitle = {
  color: "var(--fc-text)",
  fontSize: "14px",
  fontWeight: 800,
};

const loadingText = {
  marginTop: "2px",
  color: "var(--fc-muted)",
  fontSize: "12px",
};

const infoBox = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.68)",
  fontSize: "11px",
  lineHeight: 1.4,
  border: "1px solid rgba(255,255,255,0.08)",
};

const profileInfoBox = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.72)",
  fontSize: "11px",
  lineHeight: 1.4,
  border: "1px solid rgba(255,255,255,0.08)",
};

const infoLabel = {
  display: "block",
  color: "rgba(255,255,255,0.42)",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "4px",
};

const infoValue = {
  display: "block",
  color: "rgba(255,255,255,0.84)",
  fontSize: "12px",
};