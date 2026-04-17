import AppLayout from "@/components/AppLayout";

export default function InsightsPage() {
  const insights = [
    {
      tipo: "Performance acima da média",
      cor: "#16a34a",
      texto:
        "Engajamento de 4,8% está 27% acima da média da categoria Saúde.",
      icon: "✔",
    },
    {
      tipo: "Oportunidade de campanha",
      cor: "#2563eb",
      texto:
        "Perfil ideal para campanha de acompanhamento pós-treino vegana. Público 78% feminino, 25-34 anos.",
      icon: "○",
    },
    {
      tipo: "Sugestão de conteúdo",
      cor: "#16a34a",
      texto:
        "Reels com participação de rotina fitness têm 2,4x mais engajamento neste perfil.",
      icon: "✦",
    },
    {
      tipo: "Atenção ao alcance",
      cor: "#f59e0b",
      texto:
        "Alcance orgânico caiu 12% nos últimos 4 semanas. Considere impulsionamento.",
      icon: "△",
    },
    {
      tipo: "Recomendação",
      cor: "#16a34a",
      texto:
        "Renovar contrato e aumentar investimento em 20%. ROI projetado de 5,1x para o próximo trimestre.",
      icon: "✓",
    },
  ];

  return (
    <AppLayout>
      <div>
        {/* header */}
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 style={title}>IA Insights</h1>
            <p style={subtitle}>
              Análises inteligentes e recomendações automáticas
            </p>
          </div>

          <button style={primaryButton}>⚡ Analisar Creator Atual</button>
        </div>

        {/* creator resumo */}
        <div style={{ ...card, marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={avatarBox}>👤</div>

            <div style={{ flex: 1 }}>
              <div style={nameStyle}>Ana Beatriz Costa</div>
              <div style={userStyle}>@anabcosta · Saúde · suplemento</div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span style={miniBadge}>92/100</span>
                <span style={miniBadge}>245K</span>
                <span style={miniBadge}>4.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* lista insights */}
        <div style={{ display: "grid", gap: "6px" }}>
          {insights.map((item, i) => (
            <div key={i} style={rowCard}>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "999px",
                  background: `${item.cor}15`,
                  color: item.cor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {item.icon}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "2px",
                  }}
                >
                  {item.tipo}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    lineHeight: 1.5,
                  }}
                >
                  {item.texto}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* rodapé */}
        <div
          style={{
            ...card,
            marginTop: "10px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "10px",
            padding: "18px 12px",
          }}
        >
          ✧ Preparado para integração com modelos de IA via OpenRouter
        </div>
      </div>
    </AppLayout>
  );
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
  padding: "12px",
};

const rowCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 12px",
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
};

const primaryButton = {
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const avatarBox = {
  width: "28px",
  height: "28px",
  borderRadius: "999px",
  background: "#dbeafe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
};

const nameStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#111827",
};

const userStyle = {
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "2px",
};

const miniBadge = {
  fontSize: "10px",
  color: "#374151",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "2px 6px",
};