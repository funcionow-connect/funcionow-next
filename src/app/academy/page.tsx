import AppLayout from "@/components/AppLayout";

export default function AcademyPage() {
  const trilhas = [
    {
      titulo: "Fundamentos do Marketing de Influência",
      nivel: "Iniciante",
      aulas: 8,
      duracao: "40 min",
      categoria: "Marketing",
      concluidas: 5,
    },
    {
      titulo: "Criação de Conteúdo para Redes Sociais",
      nivel: "Intermediário",
      aulas: 12,
      duracao: "45 min",
      categoria: "Conteúdo",
      concluidas: 8,
    },
    {
      titulo: "Análise de Métricas e Performance",
      nivel: "Avançado",
      aulas: 6,
      duracao: "35 min",
      categoria: "Analytics",
      concluidas: 2,
    },
    {
      titulo: "Storytelling para Marcas",
      nivel: "Intermediário",
      aulas: 10,
      duracao: "50 min",
      categoria: "Conteúdo",
      concluidas: 0,
    },
    {
      titulo: "Negociação com Creators",
      nivel: "Avançado",
      aulas: 5,
      duracao: "20 min",
      categoria: "Gestão",
      concluidas: 5,
    },
  ];

  return (
    <AppLayout>
      <div>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Academy</h1>
          <p style={subtitle}>
            Trilhas de treinamento para desenvolver creators
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {trilhas.map((t, i) => {
            const pct = Math.round((t.concluidas / t.aulas) * 100);

            return (
              <div key={i} style={card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={iconBox}>📖</div>
                  <span style={badgeStyle(t.nivel)}>{t.nivel}</span>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "8px",
                    lineHeight: 1.4,
                  }}
                >
                  {t.titulo}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    fontSize: "11px",
                    color: "#6b7280",
                    marginBottom: "14px",
                  }}
                >
                  <span>{t.aulas} aulas</span>
                  <span>{t.duracao}</span>
                  <span style={categoryBadge}>{t.categoria}</span>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>
                      {t.concluidas}/{t.aulas} concluídas
                    </span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>
                      {pct}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "#e5e7eb",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "#0f766e",
                        borderRadius: "999px",
                      }}
                    />
                  </div>

                  {pct === 100 && (
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "11px",
                        color: "#16a34a",
                        fontWeight: 500,
                      }}
                    >
                      ✓ Trilha concluída
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function badgeStyle(nivel: string) {
  if (nivel === "Iniciante") {
    return {
      background: "#dcfce7",
      color: "#166534",
      fontSize: "10px",
      padding: "3px 8px",
      borderRadius: "999px",
      fontWeight: 600,
    };
  }

  if (nivel === "Intermediário") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      fontSize: "10px",
      padding: "3px 8px",
      borderRadius: "999px",
      fontWeight: 600,
    };
  }

  return {
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "10px",
    padding: "3px 8px",
    borderRadius: "999px",
    fontWeight: 600,
  };
}

const title = {
  fontSize: "22px",
  fontWeight: 700,
  margin: 0,
};

const subtitle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "14px",
};

const iconBox = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "#ecfeff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
};

const categoryBadge = {
  background: "#f3f4f6",
  color: "#374151",
  padding: "2px 6px",
  borderRadius: "999px",
  fontSize: "10px",
};