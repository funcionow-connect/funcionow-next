import AppLayout from "@/components/AppLayout";

export default function AvaliacoesPage() {
  const criterios = [
    { nome: "Vive o lifestyle da marca", peso: "20%", tipo: "Escala 1-10", ordem: 1, nota: 7 },
    { nome: "Transmite autenticidade", peso: "20%", tipo: "Escala 1-10", ordem: 2, nota: 7 },
    { nome: "Fala de autocuidado", peso: "15%", tipo: "Escala 1-10", ordem: 3, nota: 6 },
    { nome: "Público aderente", peso: "25%", tipo: "Escala 1-10", ordem: 4, nota: 7 },
    { nome: "Conteúdo alinhado com propósito", peso: "20%", tipo: "Escala 1-10", ordem: 5, nota: 7 },
  ];

  return (
    <AppLayout>
      <div>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 style={title}>Avaliações</h1>
            <p style={subtitle}>
              Configure os critérios de avaliação dos creators
            </p>
          </div>

          <button style={primaryButton}>+ Adicionar Critério</button>
        </div>

        <div style={card}>
          <div style={tableHeader}>
            <span>CRITÉRIO</span>
            <span>PESO</span>
            <span>TIPO</span>
            <span>ORDEM</span>
            <span>NOTA MÍN.</span>
          </div>

          {criterios.map((item, i) => (
            <div key={i} style={row}>
              <span style={{ fontWeight: 500 }}>{item.nome}</span>
              <span>{item.peso}</span>
              <span>{item.tipo}</span>
              <span>{item.ordem}</span>
              <span>{item.nota}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginTop: "16px" }}>
          <div style={{ marginBottom: "12px", fontWeight: 600 }}>
            Configurações Gerais
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              alignItems: "end",
            }}
          >
            <div>
              <div style={label}>Nota mínima para aprovação</div>
              <input style={input} defaultValue="70" />
            </div>

            <div>
              <div style={label}>Peso total dos critérios</div>
              <input style={input} defaultValue="100%" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ===== STYLES ===== */

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

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  fontSize: "11px",
  color: "#6b7280",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
};

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  padding: "10px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: "13px",
  alignItems: "center",
};

const label = {
  fontSize: "11px",
  color: "#6b7280",
  marginBottom: "6px",
};

const input = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "8px 10px",
  fontSize: "12px",
  background: "#fafafa",
};

const primaryButton = {
  background: "#14b8a6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};