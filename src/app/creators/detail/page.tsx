
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabaseClient";

type UsuarioEmpresa = {
  empresa_id: string;
};

type ScoreFitItem = {
  criterio_id?: string;
  criterio_nome?: string;
  ordem?: number;
  peso?: number;
  tipo_resposta?: string;
  valor?: string | number | null;
  pontuacao_calculada?: number | null;
};

type CreatorDetalhe = {
  creator_id: string;
  empresa_id: string;
  nome: string | null;
  instagram: string | null;
  instagram_url: string | null;
  status: string | null;
  score_total: number | null;
  criado_em: string | null;
  foto_url: string | null;
  categoria_nome: string | null;
  seguidores: number | null;
  engajamento: number | null;
  curtidas_medias: number | null;
  comentarios_medios: number | null;
  tipo_creator: string | null;
  segmento_nome: string | null;
  area_speaker_nome: string | null;
  etapa_nome: string | null;
  status_decisao: string | null;
  score_parcial: number | null;
  observacoes: string | null;
  avaliado_em: string | null;
  score_fit_detalhes: ScoreFitItem[];
};

export default function CreatorDetailPage() {
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creator_id");

  const [creator, setCreator] = useState<CreatorDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCreator = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || !creatorId) {
        setCreator(null);
        setLoading(false);
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("usuario_id", session.user.id)
        .single<UsuarioEmpresa>();

      if (usuarioError || !usuario?.empresa_id) {
        console.error("Erro ao buscar empresa do usuário:", usuarioError);
        setCreator(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("v_creator_detalhe")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("empresa_id", usuario.empresa_id)
        .single();

      if (error) {
        console.error("Erro ao buscar detalhe do creator:", error);
        setCreator(null);
      } else {
        setCreator(data as CreatorDetalhe);
      }

      setLoading(false);
    };

    setTimeout(loadCreator, 300);
  }, [creatorId]);

  if (loading) {
    return (
      <AppLayout>
        <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
      </AppLayout>
    );
  }

  if (!creator) {
    return (
      <AppLayout>
        <div style={{ color: "#6b7280", fontSize: "14px" }}>
          Creator não encontrado.
        </div>
      </AppLayout>
    );
  }

  const scoreFit = (creator.score_fit_detalhes || []).map((item) => {
    const valorNumerico =
      item.pontuacao_calculada !== null && item.pontuacao_calculada !== undefined
        ? Number(item.pontuacao_calculada)
        : item.valor !== null && item.valor !== undefined && item.valor !== ""
        ? Number(item.valor)
        : 0;

    const percent = Math.max(0, Math.min(100, valorNumerico * 50));

    return {
      label: item.criterio_nome || "Critério",
      value: percent,
    };
  });

  return (
    <AppLayout>
      <div style={{ background: "#f5f5f6" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <a
            href="/creators"
            style={{
              fontSize: "12px",
              color: "#6b7280",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Voltar
          </a>

          <a
            href={`/creators/edit?creator_id=${creator.creator_id}`}
            style={{
              background: "linear-gradient(to right, #0f766e, #14b8a6)",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Editar
          </a>
        </div>

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
                {creator.nome || "Sem nome"}
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
                <span>@{creator.instagram || "-"}</span>
                <span>{creator.categoria_nome || "-"}</span>
                <span>{creator.segmento_nome || creator.area_speaker_nome || "-"}</span>
              </div>
            </div>

            <div
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "6px",
                background:
                  creator.status === "aprovado"
                    ? "#dcfce7"
                    : creator.status === "reprovado"
                    ? "#fee2e2"
                    : creator.status === "potencial"
                    ? "#dbeafe"
                    : "#fef9c3",
                color:
                  creator.status === "aprovado"
                    ? "#166534"
                    : creator.status === "reprovado"
                    ? "#991b1b"
                    : creator.status === "potencial"
                    ? "#1d4ed8"
                    : "#854d0e",
                fontWeight: 600,
              }}
            >
              {creator.status || "em_analise"}
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
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={panelStyle}>
              <div style={panelTitle}>Perfil e Métricas</div>

              <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div style={metricCard}>
                    <div style={metricLabel}>Seguidores</div>
                    <div style={metricValue}>
                      {creator.seguidores !== null && creator.seguidores !== undefined
                        ? creator.seguidores.toLocaleString("pt-BR")
                        : "-"}
                    </div>
                  </div>

                  <div style={metricCard}>
                    <div style={metricLabel}>Engajamento</div>
                    <div style={metricValue}>
                      {creator.engajamento !== null && creator.engajamento !== undefined
                        ? `${creator.engajamento}%`
                        : "-"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div style={metricCard}>
                    <div style={metricLabel}>Score Fit</div>
                    <div style={metricValue}>
                      {creator.score_parcial !== null && creator.score_parcial !== undefined
                        ? creator.score_parcial
                        : "-"}
                    </div>
                  </div>

                  <div style={metricCard}>
                    <div style={metricLabel}>Curtidas médias</div>
                    <div style={metricValue}>
                      {creator.curtidas_medias !== null &&
                      creator.curtidas_medias !== undefined
                        ? creator.curtidas_medias.toLocaleString("pt-BR")
                        : "-"}
                    </div>
                  </div>

                  <div style={metricCard}>
                    <div style={metricLabel}>Comentários médios</div>
                    <div style={metricValue}>
                      {creator.comentarios_medios !== null &&
                      creator.comentarios_medios !== undefined
                        ? creator.comentarios_medios.toLocaleString("pt-BR")
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitle}>Informações Gerais</div>

              <div style={{ marginTop: "10px" }}>
                <InfoRow label="Categoria" value={creator.categoria_nome || "-"} />
                <InfoRow label="Segmento" value={creator.segmento_nome || "-"} />
                <InfoRow label="Área speaker" value={creator.area_speaker_nome || "-"} />
                <InfoRow label="Instagram" value={`@${creator.instagram || "-"}`} />
                <InfoRow label="Tipo" value={creator.tipo_creator || "-"} />
                <InfoRow label="Etapa" value={creator.etapa_nome || "-"} />
                <InfoRow label="Status decisão" value={creator.status_decisao || "-"} />
                <InfoRow
                  label="Criado em"
                  value={
                    creator.criado_em
                      ? new Date(creator.criado_em).toLocaleDateString("pt-BR")
                      : "-"
                  }
                />
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitle}>Resumo</div>

              <div style={{ marginTop: "10px" }}>
                <InfoRow
                  label="Comentários médios"
                  value={
                    creator.comentarios_medios !== null &&
                    creator.comentarios_medios !== undefined
                      ? creator.comentarios_medios.toLocaleString("pt-BR")
                      : "-"
                  }
                />
                <InfoRow
                  label="Avaliado em"
                  value={
                    creator.avaliado_em
                      ? new Date(creator.avaliado_em).toLocaleDateString("pt-BR")
                      : "-"
                  }
                />
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
                  <span style={{ color: "#6b7280" }}>Instagram</span>

                  {creator.instagram ? (
                    <a
                      href={
                        creator.instagram_url ||
                        `https://instagram.com/${creator.instagram}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0f766e",
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      @{creator.instagram}
                    </a>
                  ) : (
                    <span style={{ color: "#111827", fontWeight: 600 }}>-</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <div style={panelStyle}>
              <div style={panelTitle}>Score Fit Detalhado</div>

              <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                {scoreFit.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Sem critérios avaliados.
                  </div>
                ) : (
                  scoreFit.map((item, i) => (
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
                  ))
                )}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelTitle}>Campanha e Operação</div>

              <div style={{ marginTop: "10px" }}>
                <InfoRow label="Contrato" value="—" />
                <InfoRow label="Produto enviado" value="—" />
                <InfoRow label="Rastreio" value="—" />
                <InfoRow label="Entregáveis combinados" value="—" />
                <InfoRow label="Entregáveis realizados" value="—" />
                <InfoRow label="Link da publi" value="—" />
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
                {creator.observacoes || "Sem observações."}
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
