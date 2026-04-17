import AppLayout from "@/components/AppLayout";

export default function RewardsPage() {
  const ranking = [
    { pos: 1, nome: "Ana Beatriz Costa", user: "@anabcosta", pontos: 2450, emoji: "🥇" },
    { pos: 2, nome: "Pedro Oliveira", user: "@pedrowellness", pontos: 2280, emoji: "🥈" },
    { pos: 3, nome: "Camila Rocha", user: "@camilabeauty", pontos: 2100, emoji: "🥉" },
    { pos: 4, nome: "Lucas Mendes", user: "@lucasmkt", pontos: 1950, emoji: "👤" },
    { pos: 5, nome: "Juliana Ferreira", user: "@juliafit", pontos: 1720, emoji: "👤" },
  ];

  const metas = [
    { nome: "Atingir 5 entregáveis no mês", pct: 60 },
    { nome: "Manter engajamento acima de 4%", pct: 100 },
    { nome: "Completar trilha Academy", pct: 60 },
  ];

  const badges = [
    { nome: "Primeiro Post", desc: "Publicou o primeiro conteúdo", icon: "🏆", active: true },
    { nome: "Engajamento Alto", desc: "Atingiu 5% de engajamento", icon: "🔥", active: true },
    { nome: "Top Creator", desc: "Ficou no top 3 do ranking", icon: "⭐", active: true },
    { nome: "Campanha Perfeita", desc: "Entregou 100% dos entregáveis", icon: "💎", active: false },
    { nome: "Mentor", desc: "Compartilhou boas práticas", icon: "🪨", active: false },
    { nome: "Viral", desc: "Conteúdo passou de 100k views", icon: "🕊️", active: false },
  ];

  return (
    <AppLayout>
      <div>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Rewards</h1>
          <p style={subtitle}>Gamificação, metas e recompensas para creators</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.1fr 1fr",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={card}>
            <div style={sectionTitle}>🏆 Ranking</div>

            <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
              {ranking.map((item) => (
                <div key={item.pos} style={rankRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={posCircle(item.pos)}>{item.pos}</div>
                    <div style={avatarBox}>{item.emoji}</div>
                    <div>
                      <div style={nameStyle}>{item.nome}</div>
                      <div style={userStyle}>{item.user}</div>
                    </div>
                  </div>

                  <div style={pointsStyle}>{item.pontos} pts</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <div style={card}>
              <div style={sectionTitle}>🎯 Metas</div>

              <div style={{ marginTop: "10px", display: "grid", gap: "12px" }}>
                {metas.map((meta, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ color: "#374151" }}>{meta.nome}</span>
                      <span style={{ color: "#6b7280" }}>{meta.pct}%</span>
                    </div>

                    <div style={progressBg}>
                      <div style={{ ...progressFill, width: `${meta.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(180deg, #f59e0b 0%, #f97316 100%)",
                borderRadius: "10px",
                padding: "18px 16px",
                color: "white",
                textAlign: "center" as const,
              }}
            >
              <div style={{ fontSize: "18px", marginBottom: "8px" }}>🎁</div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                Roda de Prêmios
              </div>
              <div style={{ fontSize: "11px", opacity: 0.95, marginBottom: "12px" }}>
                Complete metas para girar a roda
              </div>
              <button style={spinButton}>Girar Roda</button>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={sectionTitle}>🏅 Badges</div>

          <div
            style={{
              marginTop: "12px",
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "8px",
            }}
          >
            {badges.map((badge, i) => (
              <div key={i} style={badgeCard(badge.active)}>
                <div style={{ fontSize: "18px", marginBottom: "8px", opacity: badge.active ? 1 : 0.45 }}>
                  {badge.icon}
                </div>
                <div style={badgeName(badge.active)}>{badge.nome}</div>
                <div style={badgeDesc(badge.active)}>{badge.desc}</div>
              </div>
            ))}
          </div>
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

const sectionTitle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#111827",
};

const rankRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 8px",
  borderRadius: "8px",
  background: "#fafaf9",
  border: "1px solid #f1f5f9",
};

function posCircle(pos: number) {
  const bg =
    pos === 1 ? "#f59e0b" :
    pos === 2 ? "#d1d5db" :
    pos === 3 ? "#d6b38a" :
    "#e5e7eb";

  const color =
    pos <= 3 ? "white" : "#6b7280";

  return {
    width: "18px",
    height: "18px",
    borderRadius: "999px",
    background: bg,
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 700,
  };
}

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

const userStyle = {
  fontSize: "10px",
  color: "#6b7280",
};

const pointsStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#111827",
};

const progressBg = {
  width: "100%",
  height: "6px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden" as const,
};

const progressFill = {
  height: "100%",
  background: "#0f766e",
  borderRadius: "999px",
};

const spinButton = {
  background: "rgba(255,255,255,0.2)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "999px",
  padding: "6px 14px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

function badgeCard(active: boolean) {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px 8px",
    textAlign: "center" as const,
    background: active ? "#fffaf5" : "#fafafa",
    opacity: active ? 1 : 0.45,
  };
}

function badgeName(active: boolean) {
  return {
    fontSize: "11px",
    fontWeight: 600,
    color: active ? "#111827" : "#6b7280",
    marginBottom: "4px",
  };
}

function badgeDesc(active: boolean) {
  return {
    fontSize: "9px",
    color: active ? "#6b7280" : "#9ca3af",
    lineHeight: 1.4,
  };
}
