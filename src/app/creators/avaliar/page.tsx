"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type CreatorResumo = {
  creator_id: string;
  empresa_id: string;
  nome: string | null;
  instagram: string | null;
  categoria_nome: string | null;
  segmento_nome: string | null;
  area_speaker_nome: string | null;
  status: string | null;
  score_parcial: number | null;
  observacoes: string | null;
  avaliacao_id: string | null;
  etapa_id: string | null;
  score_fit_detalhes: ScoreFitItem[];
};

type Criterio = {
  criterio_id: string;
  nome: string;
  peso: number | null;
  ordem: number | null;
  tipo_resposta: string | null;
};

type Etapa = {
  etapa_id: string;
  nome: string;
  ordem: number | null;
};

type RespostaState = {
  valor: string;
  pontuacao: number;
};

export default function AvaliarCreatorPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
        </AppLayout>
      }
    >
      <AvaliarCreatorContent />
    </Suspense>
  );
}

function AvaliarCreatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creator_id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [etapaIdAtual, setEtapaIdAtual] = useState<string | null>(null);

  const [creator, setCreator] = useState<CreatorResumo | null>(null);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [respostas, setRespostas] = useState<Record<string, RespostaState>>({});

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user || !creatorId) {
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
          setLoading(false);
          return;
        }

        setEmpresaId(usuario.empresa_id);

        const [creatorRes, criteriosRes, etapasRes] = await Promise.all([
          supabase
            .from("v_creator_detalhe")
            .select(
              "creator_id, empresa_id, nome, instagram, categoria_nome, segmento_nome, area_speaker_nome, status, score_parcial, observacoes, avaliacao_id, etapa_id, score_fit_detalhes"
            )
            .eq("creator_id", creatorId)
            .eq("empresa_id", usuario.empresa_id)
            .single<CreatorResumo>(),

          supabase
            .from("criterios_avaliacao")
            .select("criterio_id, nome, peso, ordem, tipo_resposta")
            .eq("empresa_id", usuario.empresa_id)
            .order("ordem", { ascending: true, nullsFirst: false })
            .order("nome", { ascending: true }),

          supabase
            .from("funil_etapas")
            .select("etapa_id, nome, ordem")
            .eq("empresa_id", usuario.empresa_id)
            .order("ordem", { ascending: true })
            .order("nome", { ascending: true }),
        ]);

        if (creatorRes.error) {
          console.error("Erro ao buscar creator:", creatorRes.error);
          setCreator(null);
        } else {
          const creatorData = creatorRes.data as CreatorResumo;
          setCreator(creatorData);
          setObservacoes(creatorData.observacoes || "");

          const respostasIniciais: Record<string, RespostaState> = {};

          (creatorData.score_fit_detalhes || []).forEach((item) => {
            if (!item.criterio_id) return;

            respostasIniciais[item.criterio_id] = {
              valor:
                item.valor !== null && item.valor !== undefined
                  ? String(item.valor)
                  : "",
              pontuacao:
                item.pontuacao_calculada !== null &&
                item.pontuacao_calculada !== undefined
                  ? Number(item.pontuacao_calculada)
                  : 0,
            };
          });

          setRespostas(respostasIniciais);
        }

        if (criteriosRes.error) {
          console.error("Erro ao buscar critérios:", criteriosRes.error);
          setCriterios([]);
        } else {
          setCriterios((criteriosRes.data as Criterio[]) || []);
        }

        if (etapasRes.error) {
          console.error("Erro ao buscar etapas:", etapasRes.error);
          setEtapaIdAtual(null);
        } else {
          const etapas = (etapasRes.data as Etapa[]) || [];
          const etapaPadrao = etapas[0]?.etapa_id || null;
          const etapaDoCreator = creatorRes.data?.etapa_id || null;
          setEtapaIdAtual(etapaDoCreator || etapaPadrao);
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar avaliação:", err);
        alert("Erro de conexão ao carregar avaliação.");
      } finally {
        setLoading(false);
      }
    };

    setTimeout(loadPage, 300);
  }, [creatorId]);

  const calcularPontuacao = (
    tipoResposta: string | null,
    peso: number | null,
    valor: string
  ) => {
    const pesoFinal = peso ?? 1;

    if (tipoResposta === "sim_nao") {
      return valor === "sim" ? pesoFinal : 0;
    }

    if (tipoResposta === "escala") {
      const numero = Number(valor);
      if (Number.isNaN(numero) || numero <= 0) return 0;
      return Number(((numero / 5) * pesoFinal).toFixed(2));
    }

    return 0;
  };

  const handleChangeResposta = (
    criterioId: string,
    tipoResposta: string | null,
    peso: number | null,
    valor: string
  ) => {
    setRespostas((prev) => ({
      ...prev,
      [criterioId]: {
        valor,
        pontuacao: calcularPontuacao(tipoResposta, peso, valor),
      },
    }));
  };

  const pontuacaoBruta = useMemo(() => {
    return Number(
      Object.values(respostas)
        .reduce((acc, item) => acc + (item.pontuacao || 0), 0)
        .toFixed(2)
    );
  }, [respostas]);

  const pesoMaximo = useMemo(() => {
    return Number(
      criterios.reduce((acc, criterio) => acc + (criterio.peso ?? 0), 0).toFixed(2)
    );
  }, [criterios]);

  const notaPrevista = useMemo(() => {
    if (pesoMaximo <= 0) return 0;
    return Number(((pontuacaoBruta / pesoMaximo) * 10).toFixed(2));
  }, [pontuacaoBruta, pesoMaximo]);

  const handleSalvar = async () => {
    try {
      if (!creatorId || !empresaId || !creator) {
        alert("Creator ou empresa não encontrados.");
        return;
      }

      if (!etapaIdAtual) {
        alert("Etapa de avaliação não encontrada.");
        return;
      }

      if (criterios.length === 0) {
        alert("Nenhum critério cadastrado para esta empresa.");
        return;
      }

      const respostasPayload: Record<string, { valor: string; pontuacao: number }> =
        {};

      criterios.forEach((criterio) => {
        const resposta = respostas[criterio.criterio_id];

        respostasPayload[criterio.criterio_id] = {
          valor: resposta?.valor || "",
          pontuacao: resposta?.pontuacao || 0,
        };
      });

      setSaving(true);

      const { error } = await supabase.rpc("salvar_avaliacao_creator", {
        p_creator_id: creatorId,
        p_empresa_id: empresaId,
        p_score_parcial: pontuacaoBruta,
        p_observacoes: observacoes || null,
        p_respostas: respostasPayload,
        p_avaliacao_id: creator.avaliacao_id || null,
        p_etapa_id: etapaIdAtual,
        p_status_decisao: null,
      });

      if (error) {
        console.error("Erro ao salvar avaliação:", error);
        alert(error.message);
        return;
      }

      alert("Avaliação salva com sucesso.");
      router.push(`/creators/detail?creator_id=${creatorId}`);
    } catch (err) {
      console.error("Erro inesperado ao salvar avaliação:", err);
      alert("Erro de conexão ao salvar avaliação.");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <AppLayout>
      <div style={{ maxWidth: "900px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <a
            href={`/creators/detail?creator_id=${creator.creator_id}`}
            style={{
              fontSize: "12px",
              color: "#6b7280",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Voltar ao detalhe
          </a>
        </div>

        <div style={card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
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
              <h1
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Avaliar Creator
              </h1>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#6b7280",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span>{creator.nome || "Sem nome"}</span>
                <span>@{creator.instagram || "-"}</span>
                <span>{creator.categoria_nome || "-"}</span>
                <span>
                  {creator.segmento_nome || creator.area_speaker_nome || "-"}
                </span>
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

        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Critérios de avaliação
            </h2>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Pontos: {pontuacaoBruta} / {pesoMaximo || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#111827", fontWeight: 700 }}>
                Nota prevista: {notaPrevista} / 10
              </div>
            </div>
          </div>

          {criterios.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Nenhum critério cadastrado para esta empresa.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {criterios.map((criterio) => {
                const respostaAtual = respostas[criterio.criterio_id];

                return (
                  <div key={criterio.criterio_id} style={criterioCard}>
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "4px",
                        }}
                      >
                        {criterio.nome}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "12px",
                        }}
                      >
                        <span>Ordem: {criterio.ordem ?? "-"}</span>
                        <span>Peso: {criterio.peso ?? "-"}</span>
                        <span>
                          Tipo:{" "}
                          {criterio.tipo_resposta === "sim_nao"
                            ? "Sim / Não"
                            : criterio.tipo_resposta === "escala"
                            ? "Escala"
                            : criterio.tipo_resposta ?? "-"}
                        </span>
                      </div>
                    </div>

                    {criterio.tipo_resposta === "sim_nao" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeResposta(
                              criterio.criterio_id,
                              criterio.tipo_resposta,
                              criterio.peso,
                              "sim"
                            )
                          }
                          style={{
                            ...choiceButton,
                            ...(respostaAtual?.valor === "sim"
                              ? activeChoiceButton
                              : {}),
                          }}
                        >
                          Sim
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleChangeResposta(
                              criterio.criterio_id,
                              criterio.tipo_resposta,
                              criterio.peso,
                              "nao"
                            )
                          }
                          style={{
                            ...choiceButton,
                            ...(respostaAtual?.valor === "nao"
                              ? inactiveChoiceButton
                              : {}),
                          }}
                        >
                          Não
                        </button>

                        <span style={scoreHint}>
                          Pontuação: {respostaAtual?.pontuacao ?? 0}
                        </span>
                      </div>
                    ) : criterio.tipo_resposta === "escala" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <select
                          value={respostaAtual?.valor || ""}
                          onChange={(e) =>
                            handleChangeResposta(
                              criterio.criterio_id,
                              criterio.tipo_resposta,
                              criterio.peso,
                              e.target.value
                            )
                          }
                          style={selectInput}
                        >
                          <option value="">Selecione</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>

                        <span style={scoreHint}>
                          Pontuação: {respostaAtual?.pontuacao ?? 0}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Tipo de resposta não suportado.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={card}>
          <div
            style={{
              marginBottom: "12px",
              fontSize: "15px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Observações
          </div>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Escreva observações sobre a avaliação..."
            style={textareaStyle}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() =>
              router.push(`/creators/detail?creator_id=${creator.creator_id}`)
            }
            style={secondaryButton}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            style={primaryButton}
          >
            {saving ? "Salvando..." : "Salvar avaliação"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "12px",
};

const criterioCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px",
  background: "#fafafa",
};

const choiceButton = {
  border: "1px solid #d1d5db",
  background: "white",
  color: "#111827",
  borderRadius: "8px",
  padding: "8px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const activeChoiceButton = {
  background: "#ccfbf1",
  border: "1px solid #14b8a6",
  color: "#0f766e",
};

const inactiveChoiceButton = {
  background: "#fee2e2",
  border: "1px solid #ef4444",
  color: "#991b1b",
};

const selectInput = {
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "12px",
  background: "white",
};

const scoreHint = {
  fontSize: "12px",
  color: "#6b7280",
};

const textareaStyle = {
  width: "100%",
  minHeight: "110px",
  resize: "vertical" as const,
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "13px",
  boxSizing: "border-box" as const,
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

const secondaryButton = {
  background: "white",
  color: "#111827",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};