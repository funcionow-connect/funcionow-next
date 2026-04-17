import AppLayout from "@/components/AppLayout";

export default function CampanhasPage() {
  const campanhas = [
    {
      nome: "Verão Fitness 2024",
      status: "Ativa",
      creators: 12,
      entregaveis: "28/36",
      roi: "4.4x",
      custo: "R$ 42K",
      receita: "R$ 185K",
    },
    {
      nome: "Skincare Routine",
      status: "Ativa",
      creators: 8,
      entregaveis: "18/24",
      roi: "4x",
      custo: "R$ 22K",
      receita: "R$ 112K",
    },
    {
      nome: "Bem-estar Total",
      status: "Planejada",
      creators: 5,
      entregaveis: "0/15",
      roi: "-",
      custo: "R$ 15K",
      receita: "R$ -",
    },
    {
      nome: "Black Friday Saúde",
      status: "Finalizada",
      creators: 20,
      entregaveis: "58/60",
      roi: "4.6x",
      custo: "R$ 75K",
      receita: "R$ 342K",
    },
  ];

  return (
    <AppLayout>
      <div>
        {/* HEADER */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Campanhas</h1>
          <p style={subtitle}>Acompanhe campanhas e resultados</p>
        </div>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {campanhas.map((c, i) => (
            <div key={i} style={card}>
              {/* topo card */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600 }}>{c.nome}</div>
                <span style={statusStyle(c.status)}>{c.status}</span>
              </div>

              {/* métricas */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <Metric label="Creators" value={c.creators} />
                <Metric label="Entregáveis" value={c.entregaveis} />
                <Metric label="ROI" value={c.roi} />
              </div>

              {/* footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                <span>Custo: {c.custo}</span>
                <span>Receita: {c.receita}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

/* COMPONENTE MÉTRICA */
function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div style={metricCard}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

/* STATUS */
function statusStyle(status: string) {
  if (status === "Ativa")
    return {
      background: "#dcfce7",
      color: "#166534",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "11px",
      fontWeight: 600,
    };

  if (status === "Planejada")
    return {
      background: "#e0f2fe",
      color: "#0369a1",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "11px",
      fontWeight: 600,
    };

  return {
    background: "#f3f4f6",
    color: "#374151",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
  };
}

/* STYLES */

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

const metricCard = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px",
  textAlign: "center" as const,
};

const metricLabel = {
  fontSize: "10px",
  color: "#6b7280",
  marginBottom: "6px",
};

const metricValue = {
  fontSize: "14px",
  fontWeight: 700,
};