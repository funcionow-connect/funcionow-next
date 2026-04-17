import AppLayout from "@/components/AppLayout";

export default function ConfiguracoesPage() {
  return (
    <AppLayout>
      <div style={{ maxWidth: "520px" }}>
        {/* header */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Configurações</h1>
          <p style={subtitle}>Gerencie as configurações da sua empresa</p>
        </div>

        {/* empresa */}
        <div style={card}>
          <h3 style={sectionTitle}>🏢 Empresa</h3>

          <div style={grid2}>
            <div>
              <label style={label}>Nome da empresa</label>
              <input style={input} defaultValue="Funcionow Ltda" />
            </div>

            <div>
              <label style={label}>E-mail de contato</label>
              <input style={input} defaultValue="contato@funcionow.com" />
            </div>

            <div>
              <label style={label}>Website</label>
              <input style={input} defaultValue="https://funcionow.com" />
            </div>

            <div>
              <label style={label}>Segmento</label>
              <input style={input} defaultValue="SaaS e Influencer" />
            </div>
          </div>
        </div>

        {/* notificações */}
        <div style={card}>
          <h3 style={sectionTitle}>🔔 Notificações</h3>

          <div style={toggleRow}>
            <span>Novos creators cadastrados</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Creators aprovados/reprovados</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Relatórios semanais</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Campanhas finalizadas</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Alertas de performance</span>
            <Toggle defaultOn />
          </div>
        </div>

        {/* segurança */}
        <div style={card}>
          <h3 style={sectionTitle}>🔒 Segurança</h3>

          <div style={grid2}>
            <div>
              <label style={label}>Senha atual</label>
              <input style={input} type="password" defaultValue="********" />
            </div>

            <div>
              <label style={label}>Nova senha</label>
              <input style={input} type="password" />
            </div>
          </div>
        </div>

        <button style={saveButton}>Salvar Configurações</button>
      </div>
    </AppLayout>
  );
}

/* COMPONENTE TOGGLE */
function Toggle({ defaultOn = false }) {
  return (
    <div
      style={{
        width: "36px",
        height: "18px",
        borderRadius: "999px",
        background: defaultOn ? "#14b8a6" : "#e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: "2px",
        justifyContent: defaultOn ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "999px",
          background: "white",
        }}
      />
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
  marginBottom: "12px",
};

const sectionTitle = {
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "12px",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const label = {
  fontSize: "10px",
  color: "#6b7280",
  display: "block",
  marginBottom: "4px",
};

const input = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "12px",
  boxSizing: "border-box" as const,
};

const toggleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "12px",
  padding: "6px 0",
};

const saveButton = {
  background: "#14b8a6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};
