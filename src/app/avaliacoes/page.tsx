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
  permitir_potencial: boolean | null;
};

export default function AvaliacoesPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingCriterio, setSavingCriterio] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);

  const [nomeCriterio, setNomeCriterio] = useState("");
  const [pesoCriterio, setPesoCriterio] = useState("");
  const [tipoResposta, setTipoResposta] = useState("sim_nao");
  const [ordemCriterio, setOrdemCriterio] = useState("");
  const [etapaId, setEtapaId] = useState("");

  const [minScoreAprovacao, setMinScoreAprovacao] = useState("7");
  const [permitirPotencial, setPermitirPotencial] = useState(true);

  const loadPage = async () => {
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
        .select("empresa_id, min_score_aprovacao, permitir_potencial")
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

      if (etapasData.length > 0 && !etapaId) {
        setEtapaId(etapasData[0].etapa_id);
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
      setPermitirPotencial(configRes.data.permitir_potencial ?? true);
    } else {
      setMinScoreAprovacao("7");
      setPermitirPotencial(true);
    }

    setLoading(false);
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

  const handleCreateCriterio = async () => {
    if (!nomeCriterio.trim()) {
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

    setSavingCriterio(true);

    const pesoNumerico = Number(pesoCriterio.replace(",", "."));
    const ordemNumerica = ordemCriterio ? Number(ordemCriterio) : null;

    const { error } = await supabase.from("criterios_avaliacao").insert([
      {
        empresa_id: empresaId,
        etapa_id: etapaId,
        nome: nomeCriterio.trim(),
        peso: Number.isNaN(pesoNumerico) ? 1 : pesoNumerico,
        tipo_resposta: tipoResposta,
        ordem: ordemNumerica,
      },
    ]);

    setSavingCriterio(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNomeCriterio("");
    setPesoCriterio("");
    setTipoResposta("sim_nao");
    setOrdemCriterio("");

    await loadPage();
  };

  const handleSaveConfig = async () => {
    if (!empresaId) {
      alert("Empresa não encontrada.");
      return;
    }

    setSavingConfig(true);

    const minScore = Number(minScoreAprovacao.replace(",", "."));

    const { data: existingConfig, error: findError } = await supabase
      .from("configuracoes_funil")
      .select("empresa_id")
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (findError) {
      setSavingConfig(false);
      alert(findError.message);
      return;
    }

    let saveError = null;

    if (existingConfig) {
      const { error } = await supabase
        .from("configuracoes_funil")
        .update({
          min_score_aprovacao: Number.isNaN(minScore) ? 7 : minScore,
          permitir_potencial: permitirPotencial,
        })
        .eq("empresa_id", empresaId);

      saveError = error;
    } else {
      const { error } = await supabase.from("configuracoes_funil").insert([
        {
          empresa_id: empresaId,
          min_score_aprovacao: Number.isNaN(minScore) ? 7 : minScore,
          permitir_potencial: permitirPotencial,
        },
      ]);

      saveError = error;
    }

    setSavingConfig(false);

    if (saveError) {
      alert(saveError.message);
      return;
    }

    alert("Configurações gerais salvas com sucesso.");
    await loadPage();
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
              <div style={label}>Peso</div>
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
                <option value="sim_nao">sim_nao</option>
                <option value="escala">escala</option>
              </select>
            </div>

            <div style={fieldWrap}>
              <div style={label}>Ordem</div>
              <input
                style={input}
                value={ordemCriterio}
                onChange={(e) => setOrdemCriterio(e.target.value)}
                placeholder="Ex: 1"
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
            <span>ETAPA</span>
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
                <span>{item.tipo_resposta ?? "-"}</span>
                <span>{item.ordem ?? "-"}</span>
                <span>{item.etapaNome}</span>
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
              gridTemplateColumns: "1fr 1fr",
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
