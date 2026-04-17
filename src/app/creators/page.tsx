"use client";

import AppLayout from "@/components/AppLayout";

export default function CreatorsPage() {
  const creators = [
    {
      name: "Ana Beatriz Costa",
      handle: "@anabcosta",
      followers: "245K",
      engagement: "4.8%",
      score: "92/100",
      category: "Saúde",
      status: "Aprovado",
      date: "2024-03-15",
    },
    {
      name: "Lucas Mendes",
      handle: "@lucasmkt",
      followers: "189K",
      engagement: "3.9%",
      score: "87/100",
      category: "Esporte",
      status: "Aprovado",
      date: "2024-03-12",
    },
    {
      name: "Mariana Silva",
      handle: "@marisilva",
      followers: "320K",
      engagement: "5.2%",
      score: "71/100",
      category: "Beleza",
      status: "Em análise",
      date: "2024-03-18",
    },
    {
      name: "Pedro Oliveira",
      handle: "@pedrowellness",
      followers: "98K",
      engagement: "6.1%",
      score: "95/100",
      category: "Bem-estar",
      status: "Aprovado",
      date: "2024-03-10",
    },
    {
      name: "Juliana Ferreira",
      handle: "@juliafit",
      followers: "156K",
      engagement: "4.2%",
      score: "72/100",
      category: "Esporte",
      status: "Em análise",
      date: "2024-03-20",
    },
    {
      name: "Rafael Santos",
      handle: "@rafaesportes",
      followers: "412K",
      engagement: "3.5%",
      score: "45/100",
      category: "Esporte",
      status: "Reprovado",
      date: "2024-03-08",
    },
    {
      name: "Camila Rocha",
      handle: "@camilabeauty",
      followers: "278K",
      engagement: "5.8%",
      score: "88/100",
      category: "Beleza",
      status: "Aprovado",
      date: "2024-03-17",
    },
    {
      name: "Thiago Nascimento",
      handle: "@thiagoinflu",
      followers: "134K",
      engagement: "4.5%",
      score: "63/100",
      category: "Saúde",
      status: "Pendente",
      date: "2024-03-22",
    },
  ];

  return (
    <AppLayout>
      <div style={{ background: "#f5f5f6" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Creators
            </h1>

            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginTop: "6px",
              }}
            >
              8 creators cadastrados
            </p>
          </div>

          <button
            style={{
              background: "linear-gradient(to right, #0f766e, #14b8a6)",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 4px 10px rgba(20, 184, 166, 0.18)",
            }}
          >
            + Novo Creator
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <input
            placeholder="Buscar creators..."
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "white",
              fontSize: "13px",
            }}
          />

          <select style={filterStyle}>
            <option>Todos os status</option>
          </select>

          <select style={filterStyle}>
            <option>Todas categorias</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {creators.map((c, i) => (
            <a
              key={i}
              href="/creators/detail"
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "16px",
                border: "1px solid #e5e7eb",
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "999px",
                    background: "#fde68a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  👤
                </div>

                <div>
                  <h3 style={{ fontSize: "14px", margin: 0 }}>{c.name}</h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    {c.handle}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <div style={metricBox}>
                  <div style={metricLabel}>Seguidores</div>
                  <div style={metricValue}>{c.followers}</div>
                </div>

                <div style={metricBox}>
                  <div style={metricLabel}>Engajamento</div>
                  <div style={metricValue}>{c.engagement}</div>
                </div>

                <div style={metricBox}>
                  <div style={metricLabel}>Score Fit</div>
                  <div style={metricValue}>{c.score}</div>
                </div>

                <div style={metricBox}>
                  <div style={metricLabel}>Categoria</div>
                  <div style={metricValue}>{c.category}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    display: "inline-block",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background:
                      c.status === "Aprovado"
                        ? "#dcfce7"
                        : c.status === "Reprovado"
                        ? "#fee2e2"
                        : c.status === "Pendente"
                        ? "#e5e7eb"
                        : "#fef9c3",
                    color:
                      c.status === "Aprovado"
                        ? "#166534"
                        : c.status === "Reprovado"
                        ? "#991b1b"
                        : c.status === "Pendente"
                        ? "#374151"
                        : "#854d0e",
                  }}
                >
                  {c.status}
                </div>

                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                  {c.date}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

const metricBox = {
  background: "#f3f4f6",
  borderRadius: "8px",
  padding: "8px",
};

const metricLabel = {
  fontSize: "11px",
  color: "#6b7280",
  marginBottom: "2px",
};

const metricValue = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#111827",
};

const filterStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "white",
  fontSize: "13px",
};
