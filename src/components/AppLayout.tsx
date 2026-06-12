"use client";

import Link from "next/link";
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

type MenuGroup = {
  label: string;
  ordem: number;
  items: MenuItem[];
  defaultOpen?: boolean;
};

type MenuGroupDefinition = {
  label: string;
  ordem: number;
  hrefs: string[];
  defaultOpen?: boolean;
};

const fallbackMenuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", match: "/dashboard", ordem: 1 },
  { label: "Creators", href: "/creators", match: "/creators", ordem: 2 },
  { label: "Avaliações", href: "/avaliacoes", match: "/avaliacoes", ordem: 3 },
  { label: "Campanhas", href: "/campanhas", match: "/campanhas", ordem: 4 },
  { label: "Academy", href: "/academy", match: "/academy", ordem: 5 },
  { label: "Rewards", href: "/rewards", match: "/rewards", ordem: 6 },
  { label: "Community", href: "/community", match: "/community", ordem: 7 },
  { label: "Operação", href: "/operacao", match: "/operacao", ordem: 8 },
  { label: "IA Insights", href: "/insights", match: "/insights", ordem: 9 },
  { label: "Equipe", href: "/equipe", match: "/equipe", ordem: 10 },
  {
    label: "Configurações",
    href: "/configuracoes",
    match: "/configuracoes",
    ordem: 11,
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
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // setLoading(true);

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

  const menuGroups = groupMenuItems(menuItems);

  const isMenuItemActive = (item: MenuItem) => {
    if (item.href === "/operacao") {
      return pathname === "/operacao";
    }

    return pathname === item.href || pathname.startsWith(`${item.match}/`);
  };

  const activeGroup =
    menuGroups.find((group) => group.items.some(isMenuItemActive))?.label ||
    null;

  const currentOpenGroup = openGroup || activeGroup;

  const toggleGroup = (groupLabel: string) => {
    setOpenGroup((current) => (current === groupLabel ? null : groupLabel));
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
            <div style={brandMark}>F</div>
            <div>
              <h2 style={brandTitle}>Funcionow</h2>
              <div style={brandSubtitle}>Connect</div>
            </div>
          </div>

          <nav style={nav}>
            {temEmpresa ? (
              <>
                {menuGroups.map((group) => {
                  const groupOpen = currentOpenGroup === group.label;

                  return (
                    <div key={group.label} style={menuGroupStyle}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.label)}
                        style={
                          groupOpen ? groupSummaryActiveStyle : groupSummaryStyle
                        }
                      >
                        <span>{group.label}</span>
                        <span
                          style={{
                            ...chevronStyle,
                            transform: groupOpen
                              ? "rotate(0deg)"
                              : "rotate(-90deg)",
                          }}
                        >
                          ▾
                        </span>
                      </button>

                      <div style={getGroupItemsStyle(groupOpen)}>
                        {group.items.map((item) => {
                          const active = isMenuItemActive(item);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              style={
                                active
                                  ? navSubItemActiveStyle
                                  : navSubItemStyle
                              }
                            >
                              <span
                                style={
                                  active
                                    ? activeIndicatorStyle
                                    : inactiveIndicatorStyle
                                }
                              />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
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
                <Link
                  href="/perfil"
                  style={
                    pathname.startsWith("/perfil")
                      ? navSubItemActiveStyle
                      : navSubItemStyle
                  }
                >
                  <span
                    style={
                      pathname.startsWith("/perfil")
                        ? activeIndicatorStyle
                        : inactiveIndicatorStyle
                    }
                  />
                  <span>Meu Perfil</span>
                </Link>

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
          <div style={topbarTextBox}>
            <strong style={topbarTitle}>Funcionow Connect</strong>
            <span style={topbarSubtitle}>Painel operacional</span>
          </div>

          <div style={topbarRight}>
            <div style={topbarSearch}>Pesquisar...</div>
            <div style={avatar}>{initials}</div>
          </div>
        </header>

        <main style={main}>
          <div style={mainInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}

const menuGroupDefinitions: MenuGroupDefinition[] = [
  {
    label: "Administração",
    ordem: 1,
    hrefs: ["/dashboard", "/equipe", "/configuracoes", "/perfil"],
  },
  {
    label: "Operação",
    ordem: 2,
    hrefs: [
      "/operacao",
      "/operacao/projetos",
      "/operacao/tarefas",
      "/operacao/reunioes",
      "/operacao/calendario",
      "/operacao/notas",
    ],
  },
  {
    label: "Community First",
    ordem: 3,
    hrefs: ["/creators", "/avaliacoes", "/community"],
  },
  {
    label: "Crescimento",
    ordem: 4,
    hrefs: ["/campanhas", "/academy", "/rewards", "/insights"],
  },
];

const groupMenuItems = (items: MenuItem[]): MenuGroup[] => {
  const usedHrefs = new Set<string>();

  const groups: MenuGroup[] = menuGroupDefinitions
    .map((group) => {
      const groupItems = items
        .filter((item) => group.hrefs.includes(item.href))
        .sort((a, b) => {
          return group.hrefs.indexOf(a.href) - group.hrefs.indexOf(b.href);
        });

      groupItems.forEach((item) => usedHrefs.add(item.href));

      return {
        label: group.label,
        ordem: group.ordem,
        items: groupItems,
        defaultOpen: group.defaultOpen ?? false,
      };
    })
    .filter((group) => group.items.length > 0);

  const outros = items.filter((item) => !usedHrefs.has(item.href));

  if (outros.length > 0) {
    groups.push({
      label: "Outros",
      ordem: 99,
      items: outros,
      defaultOpen: false,
    });
  }

  return groups.sort((a, b) => a.ordem - b.ordem);
};

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
      [
        "/dashboard",
        "/creators",
        "/avaliacoes",
        "/campanhas",
        "/operacao",
        "/perfil",
      ].includes(item.href),
    );
  }

  if (perfil === "terceirizado") {
    return fallbackMenuItems.filter((item) =>
      ["/dashboard", "/creators", "/avaliacoes", "/operacao", "/perfil"].includes(
        item.href,
      ),
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

const getGroupItemsStyle = (open: boolean) => ({
  display: "grid",
  gap: "4px",
  padding: open ? "7px 0 4px 14px" : "0 0 0 14px",
  maxHeight: open ? "420px" : "0px",
  opacity: open ? 1 : 0,
  overflow: "hidden",
  transform: open ? "translateY(0)" : "translateY(-4px)",
  transition:
    "max-height 260ms ease, opacity 180ms ease, transform 220ms ease, padding 220ms ease",
});

const shell = {
  display: "flex",
  minHeight: "100vh",
  background: "var(--fc-bg)",
};

const sidebar = {
  width: "240px",
  background: "linear-gradient(180deg, #2d1b69 0%, #241554 48%, #1a103f 100%)",
  color: "white",
  padding: "16px 12px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "10px 0 30px rgba(26,16,63,0.20)",
};

const brandBox = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "22px",
  padding: "4px 8px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const brandMark = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "#c5e000",
  color: "#1a1a2e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  fontWeight: 900,
  boxShadow: "0 10px 24px rgba(197,224,0,0.28)",
  flexShrink: 0,
};

const brandTitle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1,
};

const brandSubtitle = {
  marginTop: "4px",
  fontSize: "11px",
  fontWeight: 600,
  color: "rgba(255,255,255,0.45)",
};

const nav = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
};

const menuGroupStyle = {
  borderRadius: "12px",
  overflow: "hidden",
};

const groupSummaryStyle = {
  width: "100%",
  cursor: "pointer",
  padding: "10px 12px",
  borderRadius: "10px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "transparent",
  border: "1px solid transparent",
  textAlign: "left" as const,
  transition: "all 160ms ease",
};

const groupSummaryActiveStyle = {
  ...groupSummaryStyle,
  color: "#1a1a2e",
  background: "#c5e000",
  border: "1px solid rgba(197,224,0,0.95)",
  boxShadow: "0 10px 26px rgba(197,224,0,0.26)",
};

const chevronStyle = {
  fontSize: "11px",
  opacity: 0.78,
  transition: "transform 220ms ease",
};

const navSubItemStyle = {
  padding: "8px 10px",
  borderRadius: "9px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.56)",
  cursor: "pointer",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: "1px solid transparent",
  transition:
    "background 160ms ease, color 160ms ease, border 160ms ease, transform 160ms ease",
};

const navSubItemActiveStyle = {
  ...navSubItemStyle,
  color: "#c5e000",
  background: "rgba(197,224,0,0.10)",
  border: "1px solid rgba(197,224,0,0.18)",
  fontWeight: 800,
  transform: "translateX(2px)",
};

const activeIndicatorStyle = {
  width: "3px",
  height: "18px",
  borderRadius: "999px",
  background: "#c5e000",
  boxShadow: "0 0 14px rgba(197,224,0,0.70)",
  flexShrink: 0,
};

const inactiveIndicatorStyle = {
  width: "3px",
  height: "18px",
  borderRadius: "999px",
  background: "transparent",
  flexShrink: 0,
};

const logoutButton = {
  padding: "11px 12px",
  borderRadius: "12px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.66)",
  cursor: "pointer",
  textDecoration: "none",
  display: "block",
  background: "rgba(255,255,255,0.06)",
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
  height: "72px",
  background: "#ffffff",
  borderBottom: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 28px",
  position: "sticky" as const,
  top: 0,
  zIndex: 10,
};

const topbarTextBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "2px",
};

const topbarTitle = {
  color: "#1a1a2e",
  fontSize: "15px",
  fontWeight: 800,
};

const topbarSubtitle = {
  color: "#9999aa",
  fontSize: "12px",
};

const topbarRight = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const topbarSearch = {
  width: "220px",
  padding: "9px 12px",
  borderRadius: "10px",
  background: "#f4f5f9",
  border: "1px solid rgba(0,0,0,0.08)",
  color: "#9999aa",
  fontSize: "13px",
};

const avatar = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  background: "#2d1b69",
  color: "#c5e000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 900,
};

const main = {
  flex: 1,
  padding: "24px",
};

const mainInner = {
  maxWidth: "1400px",
  margin: "0 auto",
};

const loadingPage = {
  minHeight: "100vh",
  background: "var(--fc-bg)",
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
  borderRadius: "18px",
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
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.68)",
  fontSize: "11px",
  lineHeight: 1.4,
  border: "1px solid rgba(255,255,255,0.08)",
};

const profileInfoBox = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "14px",
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
