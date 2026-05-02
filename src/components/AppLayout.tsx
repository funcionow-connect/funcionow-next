"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UsuarioVinculo = {
  empresa_id: string;
  perfil: string;
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [temEmpresa, setTemEmpresa] = useState(false);
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          window.location.href = "/";
          return;
        }

        const { data: usuario, error } = await supabase
          .from("usuarios")
          .select("empresa_id, perfil")
          .eq("usuario_id", session.user.id)
          .maybeSingle<UsuarioVinculo>();

        if (error) {
          console.error("Erro ao verificar vínculo:", error);
          setTemEmpresa(false);
        } else {
          setTemEmpresa(Boolean(usuario?.empresa_id));
        }

        const { data: perfil } = await supabase
          .from("perfis_usuario")
          .select("nome")
          .eq("usuario_id", session.user.id)
          .maybeSingle<{ nome: string }>();

        setInitials(getInitials(perfil?.nome || session.user.email || "U"));

        const rotaLivreParaSemEmpresa =
          pathname === "/perfil" || pathname.startsWith("/perfil/");

        if (!usuario?.empresa_id && !rotaLivreParaSemEmpresa) {
          window.location.href = "/perfil";
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
                <a
                  href="/dashboard"
                  style={
                    pathname === "/dashboard" ? navItemActiveStyle : navItemStyle
                  }
                >
                  Dashboard
                </a>

                <a
                  href="/creators"
                  style={
                    pathname.startsWith("/creators")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Creators
                </a>

                <a
                  href="/avaliacoes"
                  style={
                    pathname.startsWith("/avaliacoes")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Avaliações
                </a>

                <a
                  href="/campanhas"
                  style={
                    pathname.startsWith("/campanhas")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Campanhas
                </a>

                <a
                  href="/academy"
                  style={
                    pathname.startsWith("/academy")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Academy
                </a>

                <a
                  href="/rewards"
                  style={
                    pathname.startsWith("/rewards")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Rewards
                </a>

                <a
                  href="/community"
                  style={
                    pathname.startsWith("/community")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Community
                </a>

                <a
                  href="/insights"
                  style={
                    pathname.startsWith("/insights")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  IA Insights
                </a>

                <a
                  href="/equipe"
                  style={
                    pathname.startsWith("/equipe")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Equipe
                </a>

                <a
                  href="/configuracoes"
                  style={
                    pathname.startsWith("/configuracoes")
                      ? navItemActiveStyle
                      : navItemStyle
                  }
                >
                  Configurações
                </a>

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