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

        setMenuItems(itensPermitidos);
        setPerfilAcessoNome(nomePerfil);

        const rotaPermitida = itensPermitidos.some((item) => {
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
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f5f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: "13px",
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f6" }}>
      <aside
        style={{
          width: "220px",
          background: "#0f172a",
          color: "white",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid #1e293b",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "24px",
              padding: "0 8px",
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "999px",
                background: "#14b8a6",
              }}
            />
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
              Funcionow
            </h2>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {temEmpresa ? (
              <>
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    style={
                      pathname === item.href ||
                      pathname.startsWith(`${item.match}/`)
                        ? navItemActiveStyle
                        : navItemStyle
                    }
                  >
                    {item.label}
                  </a>
                ))}

                <div style={profileInfoBox}>
                  Acesso: {perfilAcessoNome || "Não definido"}
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: "64px",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              background: "#14b8a6",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
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
  if (perfil === "admin") return "Admin";
  if (perfil === "suporte") return "Operacional";
  if (perfil === "terceirizado") return "Externo";
  return "Não definido";
};

const navItemStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  color: "#cbd5e1",
  cursor: "pointer",
  textDecoration: "none",
  display: "block",
};

const navItemActiveStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  color: "#ffffff",
  background: "#1e293b",
  cursor: "pointer",
  textDecoration: "none",
  display: "block",
};

const logoutButton = {
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "13px",
  color: "#cbd5e1",
  cursor: "pointer",
  textDecoration: "none",
  display: "block",
  background: "transparent",
  border: "none",
  textAlign: "left" as const,
};

const infoBox = {
  marginTop: "12px",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#1e293b",
  color: "#cbd5e1",
  fontSize: "11px",
  lineHeight: 1.4,
};

const profileInfoBox = {
  marginTop: "12px",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "#1e293b",
  color: "#cbd5e1",
  fontSize: "11px",
  lineHeight: 1.4,
};