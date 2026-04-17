"use client";
import { usePathname } from "next/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
            <a
              href="/dashboard"
              style={pathname === "/dashboard" ? navItemActiveStyle : navItemStyle}
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
          </nav>
        </div>

        <a href="/login" style={{ ...navItemStyle, marginTop: "24px" }}>
          Sair
        </a>
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
            CM
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}

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