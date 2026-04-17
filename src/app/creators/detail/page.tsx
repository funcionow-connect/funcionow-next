import AppLayout from "@/components/AppLayout";

export default function CreatorDetailPage() {
  const scoreFit = [
    { label: "Conteúdo alinhado com o propósito", value: 96 },
    { label: "Fala de saúde mental e autocuidado", value: 91 },
    { label: "Passa verdade e autenticidade", value: 95 },
    { label: "Público majoritariamente feminino", value: 98 },
    { label: "Vive o lifestyle de corrida", value: 97 },
  ];

  const custoTotal = 185.4;
  const roi = 4.2;

  return (
    <AppLayout>
      <div style={{ background: "#f5f5f6" }}>
        {/* topo */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "999px",
                background: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              👤
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "4px",
                }}
              >
                Ana Beatriz Costa
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                <span>@anabcosta</span>
                <span>Saúde</span>
                <span>Running Creator</span>
              </div>
            </div>

            <div
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "6px",
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 600,
              }}
            >
              Aprovado
            </div>
          </div>
        </div>

        {/* grid principal */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {/* coluna esquerda */}
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={panelStyle}>
              <div style={panelTitle}>Perfil e Métricas</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <div style={metricCard}>
                  <div style={metricLabel}>Score Fit</div>
                  <div style={metricValue}>94%</div>
                </div>

                <div style={metricCard}>
                  <div style={metricLabel}>Engajamento</div>
                  <div style={metricValue}>4.8%</div>
                </div>

                <div style={metricCard}>
                  <div style={metricLabel}>Seguidores</div>
                  <div style={metricValue}>245K</div>
                </div>

                <div style={metricCard}>
                  <div style={metricLabel}>Curtidas médias</div>
                  <div style={metricValue}>1.540</div>
                </div>
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitle}>Informações Gerais</div>

              <div style={{ marginTop: "10px" }}>
                <InfoRow label="Categoria" value="Saúde" />
                <InfoRow label="Segmento" value="Running Creator" />
                <InfoRow label="Instagram" value="@anabcosta" />
                <InfoRow label="Origem" value="Active Search" />
                <InfoRow label="Primeiro contato" value="2024-03-10" />
                <InfoRow label="Status" value="Aprovado" />
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitle}>Performance Financeira</div>

              <div style={{ marginTop: "10px" }}>
                <InfoRow label="Custo cachê" value="R$ 100,00" />
                <InfoRow label="Custo produto" value="R$ 60,40" />
                <InfoRow label="Custo frete" value="R$ 25,00" />
                <InfoRow label="Custo total" value={`R$ ${custoTotal.toFixed(2)}`} />
                <InfoRow label="Receita gerada" value="R$ 778,00" />
                <InfoRow label="ROI" value={`${roi}x`} />
                <InfoRow label="Decisão próximo mês" value="Renovar" />
              </div>
            </div>
          </div>

          {/* coluna direita */}
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={panelStyle}>
              <div style={panelTitle}>Score Fit Detalhado</div>

              <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                {scoreFit.map((item, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ color: "#334155" }}>{item.label}</span>
                      <span style={{ color: "#0f766e", fontWeight: 600 }}>
                        {item.value}%
                      </span>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "#e5e7eb",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${item.value}%`,
                          height: "100%",
                          background: "#0f766e",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitle}>Campanha e Operação</div>

              <div style={{ marginTop: "10px" }}>
                <InfoRow label="Contrato" value="Assinado" />
                <InfoRow label="Produto enviado" value="Kit Recovery PaceUP" />
                <InfoRow label="Rastreio" value="BR123456789" />
                <InfoRow label="Entregáveis combinados" value="3 stories + 1 reels" />
                <InfoRow label="Entregáveis realizados" value="3 stories + 1 reels" />
                <InfoRow label="Link da publi" value="Ver publicação" />
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitle}>Observações</div>

              <div
                style={{
                  marginTop: "12px",
                  minHeight: "90px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "#fafafa",
                  padding: "12px",
                  fontSize: "12px",
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                Creator com forte aderência à marca, boa consistência visual e ótimo
                histórico de entrega. Perfil indicado para continuidade.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #f1f5f9",
        fontSize: "12px",
        gap: "16px",
      }}
    >
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: 600, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

const panelStyle = {
  background: "white",
  borderRadius: "8px",
  padding: "12px",
  border: "1px solid #e5e7eb",
};

const panelTitle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#111827",
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
  marginBottom: "8px",
};

const metricValue = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#111827",
};