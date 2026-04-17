import AppLayout from "@/components/AppLayout";

export default function EquipePage() {
  const membros = [
    {
      nome: "Carolina Martins",
      email: "carolina@funcionow.com",
      perfil: "Admin",
      status: "Ativo",
      avatar: "👩🏻‍💼",
    },
    {
      nome: "Bruno Almeida",
      email: "bruno@funcionow.com",
      perfil: "Supervisor",
      status: "Ativo",
      avatar: "🧑🏽‍💼",
    },
    {
      nome: "Fernanda Lima",
      email: "fernanda@funcionow.com",
      perfil: "Colaborador",
      status: "Ativo",
      avatar: "👩🏼",
    },
    {
      nome: "Diego Costa",
      email: "diego@funcionow.com",
      perfil: "Colaborador",
      status: "Ativo",
      avatar: "🧑🏼",
    },
    {
      nome: "Isabela Santos",
      email: "isabela@funcionow.com",
      perfil: "Supervisor",
      status: "Inativo",
      avatar: "👩🏽",
    },
  ];

  return (
    <AppLayout>
      <div>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 style={title}>Equipe</h1>
            <p style={subtitle}>Gerencie os membros da sua equipe</p>
          </div>

          <button style={primaryButton}>+ Convidar Colaborador</button>
        </div>

        <div style={card}>
          {membros.map((membro, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 10px",
                borderBottom: i !== membros.length - 1 ? "1px solid #f1f5f9" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={avatarBox}>{membro.avatar}</div>

                <div>
                  <div style={nameStyle}>{membro.nome}</div>
                  <div style={emailStyle}>{membro.email}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={roleBadge(membro.perfil)}>{membro.perfil}</span>
                <span style={statusBadge(membro.status)}>{membro.status}</span>
              </div>
            </div>
          ))}
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
  padding: "0",
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

const avatarBox = {
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  background: "#e2e8f0",
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

const emailStyle = {
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "2px",
};

function roleBadge(role: string) {
  if (role === "Admin") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
    };
  }

  if (role === "Supervisor") {
    return {
      background: "#dbeafe",
      color: "#2563eb",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
    };
  }

  return {
    background: "#f3f4f6",
    color: "#6b7280",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
  };
}

function statusBadge(status: string) {
  if (status === "Ativo") {
    return {
      background: "#dcfce7",
      color: "#166534",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
    };
  }

  return {
    background: "#e5e7eb",
    color: "#6b7280",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
  };
}