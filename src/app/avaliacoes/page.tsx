"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabaseClient";

type UsuarioEmpresa = {
  empresa_id: string;
};

type Etapa = {
  etapa_id: string;
  nome: string;
  ordem: number | null;
};

type Criterio = {
  criterio_id: string;
  nome: string;
  peso: number | null;
  tipo_resposta: string | null;
  ordem: number | null;
  etapa_id: string | null;
};

type ConfiguracaoFunil = {
  empresa_id: string;
  min_score_aprovacao: number | null;
  min_score_potencial: number | null;
  permitir_potencial: boolean | null;
};

export default function AvaliacoesPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingCriterio, setSavingCriterio] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [deletingCriterioId, setDeletingCriterioId] = useState<string | null>(null);

  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);

  const [nomeCriterio, setNomeCriterio] = useState("");
  const [pesoCriterio, setPesoCriterio] = useState("");
  const [tipoResposta, setTipoResposta] = useState("sim_nao");
  const [ordemCriterio, setOrdemCriterio] = useState("");
  const [etapaId, setEtapaId] = useState("");

  const [minScoreAprovacao, setMinScoreAprovacao] = useState("7");
  const [minScorePotencial, setMinScorePotencial] = useState("5");
  const [permitirPotencial, setPermitirPotencial] = useState(true);

  const loadPage = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
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
        alert("Não foi possível identificar a empresa do usuário.");
        setLoading(false);
        return;
      }

      setEmpresaId(usuario.empresa_id);

      const [criteriosRes, etapasRes, configRes] = await Promise.all([
        supabase
          .from("criterios_avaliacao")
          .select("criterio_id, nome, peso, tipo_resposta, ordem, etapa_id")
          .eq("empresa_id", usuario.empresa_id)
          .order("ordem", { ascending: true, nullsFirst: false })
          .order("nome", { ascending: true }),

        supabase
          .from("funil_etapas")
          .select("etapa_id, nome, ordem")
          .eq("empresa_id", usuario.empresa_id)
          .order("ordem", { ascending: true })
          .order("nome", { ascending: true }),

        supabase
          .from("configuracoes_funil")
          .select(
            "empresa_id, min_score_aprovacao, min_score_potencial, permitir_potencial"
          )
          .eq("empresa_id", usuario.empresa_id)
          .maybeSingle<ConfiguracaoFunil>(),
      ]);

      if (criteriosRes.error) {
        console.error("Erro ao buscar critérios:", criteriosRes.error);
        setCriterios([]);
      } else {
        setCriterios((criteriosRes.data as Criterio[]) || []);
      }

      if (etapasRes.error) {
        console.error("Erro ao buscar etapas:", etapasRes.error);
        setEtapas([]);
      } else {
        const etapasData = (etapasRes.data as Etapa[]) || [];
        setEtapas(etapasData);

        if (etapasData.length > 0) {
          setEtapaId((prev) => prev || etapasData[0].etapa_id);
        }
      }

      if (configRes.error) {
        console.error("Erro ao buscar configurações do funil:", configRes.error);
      } else if (configRes.data) {
        setMinScoreAprovacao(
          configRes.data.min_score_aprovacao !== null &&
            configRes.data.min_score_aprovacao !== undefined
            ? String(configRes.data.min_score_aprovacao)
            : "7"
        );

        setMinScorePotencial(
          configRes.data.min_score_potencial !== null &&
            configRes.data.min_score_potencial !== undefined
            ? String(configRes.data.min_score_potencial)
            : "5"
        );

        setPermitirPotencial(configRes.data.permitir_potencial ?? true);
      } else {
        setMinScoreAprovacao("7");
        setMinScorePotencial("5");
        setPermitirPotencial(true);
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar avaliações:", err);
      alert("Erro de conexão ao carregar avaliações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(loadPage, 300);
  }, []);

  const criteriosComEtapa = useMemo(() => {
    return criterios.map((criterio) => {
      const etapa = etapas.find((e) => e.etapa_id === criterio.etapa_id);

      return {
        ...criterio,
        etapaNome: etapa?.nome || "-",
      };
    });
  }, [criterios, etapas]);

  const proximaOrdem = useMemo(() => {
    const ordensValidas = criterios
      .map((c) => c.ordem)
      .filter((ordem): ordem is number => ordem !== null && ordem !== undefined);

    if (ordensValidas.length === 0) return 1;

    return Math.max(...ordensValidas) + 1;
  }, [criterios]);

  const getTipoRespostaLabel = (tipo: string | null) => {
    if (tipo === "sim_nao") return "Sim / Não";
    if (tipo === "escala") return "Escala";
    return tipo || "-";
  };

  const handleCreateCriterio = async () => {
    try {
      const nomeLimpo = nomeCriterio.trim();

      if (!nomeLimpo) {
        alert("Digite o nome do critério.");
        return;
      }

      if (!empresaId) {
        alert("Empresa não encontrada.");
        return;
      }

      if (!etapaId) {
        alert("Selecione a etapa.");
        return;
      }

      const duplicado = criterios.some(
        (criterio) =>
          criterio.nome.trim().toLowerCase() === nomeLimpo.toLowerCase()
      );

      if (duplicado) {
        alert("Já existe um critério com esse nome.");
        return;
      }

      setSavingCriterio(true);

      const pesoNumerico = Number(pesoCriterio.replace(",", "."));
      const ordemDigitada = ordemCriterio ? Number(ordemCriterio) : null;

      const ordemFinal =
        ordemDigitada !== null && !Number.isNaN(ordemDigitada) && ordemDigitada > 0
          ? ordemDigitada
          : proximaOrdem;

      const { error } = await supabase.from("criterios_avaliacao").insert([
        {
          empresa_id: empresaId,
          etapa_id: etapaId,
          nome: nomeLimpo,
          peso:
            Number.isNaN(pesoNumerico) || pesoCriterio.trim() === ""
              ? 1
              : pesoNumerico,
          tipo_resposta: tipoResposta,
          ordem: ordemFinal,
        },
      ]);

      if (error) {
        console.error("Erro ao inserir critério:", error);
        alert(error.message);
        return;
      }

      setNomeCriterio("");
      setPesoCriterio("");
      setTipoResposta("sim_nao");
      setOrdemCriterio("");

      await loadPage();
      alert("Critério criado com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao criar critério:", err);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setSavingCriterio(false);
    }
  };

  const handleDeleteCriterio = async (criterioId: string, nome: string) => {
    const confirmado = window.confirm(`Excluir o critério "${nome}"?`);

    if (!confirmado) return;

    if (!empresaId) {
      alert("Empresa não encontrada.");
      return;
    }

    try {
      setDeletingCriterioId(criterioId);

      const { error } = await supabase
        .from("criterios_avaliacao")
        .delete()
        .eq("criterio_id", criterioId);

      if (error) {
        console.error("Erro ao excluir critério:", error);
        alert(error.message);
        return;
      }

      const { error: reorderError } = await supabase.rpc(
        "reordenar_criterios_avaliacao",
        { p_empresa_id: empresaId }
      );

      if (reorderError) {
        console.error("Erro ao reordenar critérios:", reorderError);
        alert(reorderError.message);
        return;
      }

      await loadPage();
      alert("Critério excluído com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao excluir critério:", err);
      alert("Erro de conexão ao excluir critério.");
    } finally {
      setDeletingCriterioId(null);
    }
  };

  const handleSaveConfig = async () => {
    try {
      if (!empresaId) {
        alert("Empresa não encontrada.");
        return;
      }

      setSavingConfig(true);

      const minScore = Number(minScoreAprovacao.replace(",", "."));
      const minScorePot = Number(minScorePotencial.replace(",", "."));

      const configPayload = {
        min_score_aprovacao: Number.isNaN(minScore) ? 7 : minScore,
        min_score_potencial: Number.isNaN(minScorePot) ? 5 : minScorePot,
        permitir_potencial: permitirPotencial,
      };

      const { data: existingConfig, error: findError } = await supabase
        .from("configuracoes_funil")
        .select("empresa_id")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (findError) {
        console.error("Erro ao buscar configuração existente:", findError);
        alert(findError.message);
        return;
      }

      let saveError = null;

      if (existingConfig) {
        const { error } = await supabase
          .from("configuracoes_funil")
          .update(configPayload)
          .eq("empresa_id", empresaId);

        saveError = error;
      } else {
        const { error } = await supabase.from("configuracoes_funil").insert([
          {
            empresa_id: empresaId,
            ...configPayload,
          },
        ]);

        saveError = error;
      }

      if (saveError) {
        console.error("Erro ao salvar configurações:", saveError);
        alert(saveError.message);
        return;
      }

      await loadPage();
      alert("Configurações gerais salvas com sucesso.");
    } catch (err) {
      console.error("Erro inesperado ao salvar configurações:", err);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <AppLayout>
      <div>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 style={title}>Avaliações</h1>
            <p style={subtitle}>
              Configure os critérios de avaliação dos creators
            </p>
          </div>
        </div>

        <div style={{ ...card, marginBottom: "16px" }}>
          <div style={{ marginBottom: "12px", fontWeight: 600 }}>
            Adicionar critério
          </div>

          <div style={formGrid}>
            <div style={fieldWrap}>
              <div style={label}>Nome do critério</div>
              <input
                style={input}
                value={nomeCriterio}
                onChange={(e) => setNomeCriterio(e.target.value)}
                placeholder="Ex: Público majoritariamente feminino?"
              />
            </div>

            <div style={fieldWrap}>
              <div style={label}>Peso do critério</div>
              <input
                style={input}
                value={pesoCriterio}
                onChange={(e) => setPesoCriterio(e.target.value)}
                placeholder="Ex: 2"
                inputMode="decimal"
              />
            </div>

            <div style={fieldWrap}>
              <div style={label}>Tipo de resposta</div>
              <select
                style={input}
                value={tipoResposta}
                onChange={(e) => setTipoResposta(e.target.value)}
              >
                <option value="sim_nao">Sim / Não</option>
                <option value="escala">Escala</option>
              </select>
            </div>

            <div style={fieldWrap}>
              <div style={label}>Ordem</div>
              <input
                style={input}
                value={ordemCriterio}
                onChange={(e) => setOrdemCriterio(e.target.value)}
                placeholder={`Próxima ordem: ${proximaOrdem}`}
                inputMode="numeric"
              />
            </div>

            <div style={{ ...fieldWrap, gridColumn: "1 / -1" }}>
              <div style={label}>Etapa</div>
              <select
                style={input}
                value={etapaId}
                onChange={(e) => setEtapaId(e.target.value)}
              >
                <option value="">Selecione</option>
                {etapas.map((etapa) => (
                  <option key={etapa.etapa_id} value={etapa.etapa_id}>
                    {etapa.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <button
              onClick={handleCreateCriterio}
              disabled={savingCriterio}
              style={primaryButton}
            >
              {savingCriterio ? "Salvando..." : "+ Adicionar Critério"}
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={tableHeader}>
            <span>CRITÉRIO</span>
            <span>PESO</span>
            <span>TIPO</span>
            <span>ORDEM</span>
            <span>AÇÕES</span>
          </div>

          {loading ? (
            <div style={emptyState}>Carregando critérios...</div>
          ) : criteriosComEtapa.length === 0 ? (
            <div style={emptyState}>
              Nenhum critério cadastrado. Crie o primeiro critério de avaliação.
            </div>
          ) : (
            criteriosComEtapa.map((item) => (
              <div key={item.criterio_id} style={row}>
                <span style={{ fontWeight: 500 }}>{item.nome}</span>
                <span>{item.peso ?? "-"}</span>
                <span>{getTipoRespostaLabel(item.tipo_resposta)}</span>
                <span>{item.ordem ?? "-"}</span>
                <div>
                  <button
                    onClick={() => handleDeleteCriterio(item.criterio_id, item.nome)}
                    disabled={deletingCriterioId === item.criterio_id}
                    style={deleteButton}
                  >
                    {deletingCriterioId === item.criterio_id
                      ? "Excluindo..."
                      : "Excluir"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ ...card, marginTop: "16px" }}>
          <div style={{ marginBottom: "12px", fontWeight: 600 }}>
            Configurações Gerais
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "24px",
              alignItems: "end",
            }}
          >
            <div>
              <div style={label}>Nota mínima para aprovação</div>
              <input
                style={input}
                value={minScoreAprovacao}
                onChange={(e) => setMinScoreAprovacao(e.target.value)}
                inputMode="decimal"
              />
            </div>

            <div>
              <div style={label}>Nota mínima para potencial</div>
              <input
                style={input}
                value={minScorePotencial}
                onChange={(e) => setMinScorePotencial(e.target.value)}
                inputMode="decimal"
              />
            </div>

            <div>
              <div style={label}>Permitir potencial</div>
              <select
                style={input}
                value={permitirPotencial ? "true" : "false"}
                onChange={(e) => setPermitirPotencial(e.target.value === "true")}
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              style={primaryButton}
            >
              {savingConfig ? "Salvando..." : "Salvar Configurações"}
            </button>
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

const deleteButton = {
  background: "white",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  gap: "10px",
};

const fieldWrap = {
  display: "flex",
  flexDirection: "column" as const,
};

const emptyState = {
  padding: "14px 10px",
  fontSize: "12px",
  color: "#6b7280",
};