import AppLayout from "@/components/AppLayout";

export default function CampanhaDetailPage() {
  const creators = [
    { nome: "Ana Costa", status: "Aprovado", roi: "4.2x" },
    { nome: "Lucas Mendes", status: "Em análise", roi: "3.8x" },
    { nome: "Mariana Silva", status: "Aprovado", roi: "4.5x" },
    { nome: "Pedro Oliveira", status: "Reprovado", roi: "1.2x" },
  ];

  return (
    <AppLayout>
      <div>
        {/* HEADER */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Verão Fitness 2024</h1>
          <p style={subtitle}>Resumo e performance da campanha</p>
        </div>

        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <Metric label="Creators" value="12" />
          <Metric label="Entregáveis" value="28/36" />
          <Metric label="ROI" value="4.4x" />
          <Metric label="Receita" value="R$ 185K" />
        </div>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "16px",
          }}
        >
          {/* LISTA CREATORS */}
          <div style={card}>
            <div style={sectionTitle}>Creators da campanha</div>

            <div style={{ marginTop: "12px" }}>
              {creators.map((c, i) => (
                <div key={i} style={creatorRow}>
                  <div>{c.nome}</div>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={statusStyle(c.status)}>{c.status}</span>
                    <span style={{ fontWeight: 600 }}>{c.roi}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINANCEIRO */}
          <div style={card}>
            <div style={sectionTitle}>Financeiro</div>

            <div style={{ marginTop: "12px" }}>
              <InfoRow label="Custo total" value="R$ 42K" />
              <InfoRow label="Receita total" value="R$ 185K" />
              <InfoRow label="ROI médio" value="4.4x" />
              <InfoRow label="Status campanha" value="Ativa" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* COMPONENTES */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricCard}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRow}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
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

const sectionTitle = {
  fontSize: "13px",
  fontWeight: 700,
};

const metricCard = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px",
  textAlign: "center" as const,
};

const metricLabel = {
  fontSize: "10px",
  color: "#6b7280",
};

const metricValue = {
  fontSize: "16px",
  fontWeight: 700,
};

const creatorRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: "1px solid #f1f5f9",
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #f1f5f9",
};

function statusStyle(status: string) {
  if (status === "Aprovado")
    return {
      background: "#dcfce7",
      color: "#166534",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "11px",
    };

  if (status === "Em análise")
    return {
      background: "#fef9c3",
      color: "#854d0e",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "11px",
    };

  return {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
  };
}