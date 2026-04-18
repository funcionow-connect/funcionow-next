import {supabase} from "@/lib/supabase";

import AppLayout from "@/components/AppLayout";

export default function DashboardPage() {
  async function testConnection() {
  const { data, error } = await supabase.from("creators").select("*").limit(1);
  console.log("SUPABASE TEST:", data, error);
}

testConnection();
  
  return (
    <AppLayout>
      <div style={{ background: "#f5f5f6" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              marginTop: "4px",
            }}
          >
            Visão geral da sua operação com creators
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div style={miniCard}>
            <div style={miniLabel}>Total Creators</div>
            <div style={miniValue}>127</div>
          </div>

          <div style={miniCard}>
            <div style={miniLabel}>Aprovados</div>
            <div style={miniValue}>84</div>
          </div>

          <div style={miniCard}>
            <div style={miniLabel}>Em Análise</div>
            <div style={miniValue}>28</div>
          </div>

          <div style={miniCard}>
            <div style={miniLabel}>Reprovados</div>
            <div style={miniValue}>15</div>
          </div>

          <div style={miniCard}>
            <div style={miniLabel}>Receita Gerada</div>
            <div style={miniValue}>R$ 285K</div>
          </div>

          <div style={miniCard}>
            <div style={miniLabel}>ROI Médio</div>
            <div style={miniValue}>4.2x</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={panelStyle}>
            <div style={panelTitle}>Receita Mensal</div>

            <div style={barChart}>
              {[30, 38, 50, 62, 72, 82, 88].map((h, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: `${h}px`,
                      borderRadius: "4px 4px 0 0",
                      background: "#0f766e",
                    }}
                  />
                  <span style={axisLabel}>
                    {["Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={panelTitle}>Evolução de Creators</div>

            <div
              style={{
                height: "160px",
                position: "relative",
                borderTop: "1px solid #f1f5f9",
                borderLeft: "1px solid #f1f5f9",
                marginTop: "12px",
              }}
            >
              <svg viewBox="0 0 300 160" style={{ width: "100%", height: "100%" }}>
                <polyline
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="2"
                  points="10,120 55,112 100,104 145,94 190,84 235,76 280,68"
                />
                {[10, 55, 100, 145, 190, 235, 280].map((x, i) => (
                  <circle key={i} cx={x} cy={[120, 112, 104, 94, 84, 76, 68][i]} r="3" fill="#0f766e" />
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div style={panelStyle}>
            <div style={panelTitle}>Top Creators</div>

            <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
              {[
                ["Pedro Oliveira", "R$ 28.4K"],
                ["Camila Rocha", "R$ 19.0K"],
                ["Ana Beatriz Costa", "R$ 18.6K"],
                ["Lucas Mendes", "R$ 15.4K"],
              ].map(([name, value], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#111827" }}>{name}</span>
                  <span style={{ color: "#0f766e", fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={panelTitle}>Atividades Recentes</div>

            <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
              {[
                "Creator aprovado",
                "Nova campanha criada",
                "Proposta enviada",
                "Pagamento processado",
                "Novo creator cadastrado",
              ].map((item, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#475569" }}>
                  • {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const miniCard = {
  background: "white",
  borderRadius: "8px",
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
};

const miniLabel = {
  fontSize: "10px",
  color: "#94a3b8",
  marginBottom: "6px",
};

const miniValue = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#111827",
};

const panelStyle = {
  background: "white",
  borderRadius: "8px",
  padding: "12px",
  border: "1px solid #e5e7eb",
};

const panelTitle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#111827",
};

const axisLabel = {
  fontSize: "10px",
  color: "#94a3b8",
};

const barChart = {
  height: "160px",
  display: "flex",
  alignItems: "flex-end" as const,
  gap: "12px",
  marginTop: "12px",
};