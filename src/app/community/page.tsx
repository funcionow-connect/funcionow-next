import AppLayout from "@/components/AppLayout";

export default function CommunityPage() {
  const posts = [
    {
      nome: "Ana Beatriz Costa",
      user: "@anabcosta",
      texto:
        "Acabei de fechar a campanha de verão e os resultados foram incríveis 🙌 Engajamento de 6,1% nas reels e público super conectado com a rotina fitness!",
      tempo: "há 2h",
    },
    {
      nome: "Pedro Oliveira",
      user: "@pedrowellness",
      texto:
        "Dica: vídeos com rotina + prova real têm mais engajamento do que conteúdo estático. Testem e me contem 📈",
      tempo: "há 3h",
    },
    {
      nome: "Camila Rocha",
      user: "@camilabeauty",
      texto:
        "Alguém já testou o novo formato de 4 posts em série da pace? Achei sensacional os insights que ele trouxe sobre meu público ✨",
      tempo: "há 5h",
    },
    {
      nome: "Lucas Mendes",
      user: "@lucasmkt",
      texto:
        "Completei minha trilha de Analytics na Academy! Recomendo demais para quem quer entender melhor os números da sua campanha. 🚀",
      tempo: "há 1d",
    },
  ];

  return (
    <AppLayout>
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Community</h1>
          <p style={subtitle}>
            Troque experiências entre creators e equipe
          </p>
        </div>

        {/* composer */}
        <div style={card}>
          <textarea
            placeholder="Compartilhe algo com a comunidade..."
            style={textareaStyle}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "10px",
            }}
          >
            <button style={publishButton}>Publicar</button>
          </div>
        </div>

        {/* posts */}
        <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
          {posts.map((post, i) => (
            <div key={i} style={card}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div style={avatarBox}>👤</div>

                <div style={{ flex: 1 }}>
                  <div style={nameStyle}>{post.nome}</div>
                  <div style={userStyle}>
                    {post.user} · {post.tempo}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: 1.55,
                  marginBottom: "10px",
                }}
              >
                {post.texto}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                <span>♡ 12</span>
                <span>💬 3</span>
                <span>↻</span>
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
  padding: "12px",
};

const textareaStyle = {
  width: "100%",
  minHeight: "72px",
  resize: "none" as const,
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "12px",
  color: "#111827",
  boxSizing: "border-box" as const,
};

const publishButton = {
  background: "#14b8a6",
  color: "white",
  border: "none",
  borderRadius: "999px",
  padding: "6px 14px",
  fontSize: "11px",
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

const userStyle = {
  fontSize: "10px",
  color: "#6b7280",
};