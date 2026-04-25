"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AppLayout from "@/components/AppLayout";

type UsuarioEmpresa = {
  empresa_id: string;
};

type CreatorDetalhe = {
  creator_id: string;
  empresa_id: string;
  nome: string | null;
  instagram: string | null;
  status: string | null;
  categoria_id: string | null;
  segmento_id: string | null;
  area_speaker_id: string | null;
  tipo_creator: string | null;
  seguidores: number | null;
  engajamento: number | null;
  curtidas_medias: number | null;
  comentarios_medios: number | null;
};

type Categoria = {
  categoria_id: string;
  nome: string;
};

type Segmento = {
  segmento_id: string;
  nome: string;
  categoria_id: string | null;
};

type AreaSpeaker = {
  area_speaker_id: string;
  nome: string;
  segmento_id: string;
};

type Captacao = {
  captacao_id: string;
};

export default function EditCreatorPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
        </AppLayout>
      }
    >
      <EditCreatorContent />
    </Suspense>
  );
}

function EditCreatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creator_id");

  const [loading, setLoading] = useState(true);
  const [savingCadastro, setSavingCadastro] = useState(false);
  const [savingMetricas, setSavingMetricas] = useState(false);

  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [status, setStatus] = useState("em_analise");

  const [categoriaId, setCategoriaId] = useState("");
  const [segmentoId, setSegmentoId] = useState("");
  const [areaSpeakerId, setAreaSpeakerId] = useState("");
  const [tipoCreator, setTipoCreator] = useState("");

  const [seguidores, setSeguidores] = useState("");
  const [engajamento, setEngajamento] = useState("");
  const [curtidasMedias, setCurtidasMedias] = useState("");
  const [comentariosMedios, setComentariosMedios] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [areasSpeaker, setAreasSpeaker] = useState<AreaSpeaker[]>([]);

  useEffect(() => {
    const loadPage = async () => {
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

      const [categoriasRes, segmentosRes, areasRes, creatorRes] =
        await Promise.all([
          supabase
            .from("categorias")
            .select("categoria_id, nome")
            .eq("empresa_id", usuario.empresa_id)
            .order("nome", { ascending: true }),

          supabase
            .from("segmentos")
            .select("segmento_id, nome, categoria_id")
            .eq("empresa_id", usuario.empresa_id)
            .order("nome", { ascending: true }),

          supabase
            .from("areas_speaker")
            .select("area_speaker_id, nome, segmento_id")
            .eq("empresa_id", usuario.empresa_id)
            .order("nome", { ascending: true }),

          supabase
            .from("v_creator_detalhe")
            .select(
              "creator_id, empresa_id, nome, instagram, status, categoria_id, segmento_id, area_speaker_id, tipo_creator, seguidores, engajamento, curtidas_medias, comentarios_medios"
            )
            .eq("creator_id", creatorId)
            .eq("empresa_id", usuario.empresa_id)
            .single<CreatorDetalhe>(),
        ]);

      if (categoriasRes.error) {
        console.error("Erro ao buscar categorias:", categoriasRes.error);
      } else {
        setCategorias((categoriasRes.data as Categoria[]) || []);
      }

      if (segmentosRes.error) {
        console.error("Erro ao buscar segmentos:", segmentosRes.error);
      } else {
        setSegmentos((segmentosRes.data as Segmento[]) || []);
      }

      if (areasRes.error) {
        console.error("Erro ao buscar áreas speaker:", areasRes.error);
      } else {
        setAreasSpeaker((areasRes.data as AreaSpeaker[]) || []);
      }

      if (creatorRes.error || !creatorRes.data) {
        console.error("Erro ao buscar creator:", creatorRes.error);
        setLoading(false);
        return;
      }

      const creator = creatorRes.data;

      setNome(creator.nome || "");
      setInstagram(creator.instagram || "");
      setStatus(creator.status || "em_analise");
      setCategoriaId(creator.categoria_id || "");
      setSegmentoId(creator.segmento_id || "");
      setAreaSpeakerId(creator.area_speaker_id || "");
      setTipoCreator(creator.tipo_creator || "");

      setSeguidores(
        creator.seguidores !== null && creator.seguidores !== undefined
          ? String(creator.seguidores)
          : ""
      );

      setEngajamento(
        creator.engajamento !== null && creator.engajamento !== undefined
          ? String(creator.engajamento)
          : ""
      );

      setCurtidasMedias(
        creator.curtidas_medias !== null && creator.curtidas_medias !== undefined
          ? String(creator.curtidas_medias)
          : ""
      );

      setComentariosMedios(
        creator.comentarios_medios !== null &&
          creator.comentarios_medios !== undefined
          ? String(creator.comentarios_medios)
          : ""
      );

      setLoading(false);
    };

    setTimeout(loadPage, 300);
  }, [creatorId]);

  const segmentosFiltrados = useMemo(() => {
    if (!categoriaId) return segmentos;
    return segmentos.filter((s) => s.categoria_id === categoriaId);
  }, [segmentos, categoriaId]);

  const areasFiltradas = useMemo(() => {
    if (!segmentoId) return [];
    return areasSpeaker.filter((a) => a.segmento_id === segmentoId);
  }, [areasSpeaker, segmentoId]);

  const handleCategoriaChange = (value: string) => {
    setCategoriaId(value);
    setSegmentoId("");
    setAreaSpeakerId("");
  };

  const handleSegmentoChange = (value: string) => {
    setSegmentoId(value);
    setAreaSpeakerId("");
  };

  const formatStatus = (value: string | null) => {
    if (value === "aprovado") return "Aprovado";
    if (value === "potencial") return "Potencial";
    if (value === "reprovado") return "Reprovado";
    if (value === "em_analise") return "Em análise";
    return "Em análise";
  };

  const parseNullableNumber = (value: string) => {
    if (!value.trim()) return null;
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getCaptacaoId = async () => {
    if (!empresaId || !creatorId) return null;

    const { data, error } = await supabase
      .from("creator_captacao")
      .select("captacao_id")
      .eq("creator_id", creatorId)
      .eq("empresa_id", empresaId)
      .order("atualizado_em", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return (data as Captacao[] | null)?.[0]?.captacao_id || null;
  };

  const handleSaveCadastro = async () => {
    if (!nome.trim() || !instagram.trim()) {
      alert("Preencha nome e instagram.");
      return;
    }

    if (!empresaId || !creatorId) {
      alert("Empresa ou creator não encontrado.");
      return;
    }

    setSavingCadastro(true);

    const instagramLimpo = instagram.replaceAll("@", "").trim();

    const { error: creatorError } = await supabase
      .from("creators")
      .update({
        nome: nome.trim(),
        instagram: instagramLimpo,
        categoria_id: categoriaId || null,
      })
      .eq("creator_id", creatorId)
      .eq("empresa_id", empresaId);

    if (creatorError) {
      setSavingCadastro(false);
      alert(creatorError.message);
      return;
    }

    try {
      const captacaoId = await getCaptacaoId();

      if (captacaoId) {
        const { error } = await supabase
          .from("creator_captacao")
          .update({
            segmento_id: segmentoId || null,
            area_speaker_id: areaSpeakerId || null,
            atualizado_em: new Date().toISOString(),
          })
          .eq("captacao_id", captacaoId)
          .eq("empresa_id", empresaId);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await supabase.from("creator_captacao").insert([
          {
            creator_id: creatorId,
            empresa_id: empresaId,
            segmento_id: segmentoId || null,
            area_speaker_id: areaSpeakerId || null,
            atualizado_em: new Date().toISOString(),
          },
        ]);

        if (error) {
          throw new Error(error.message);
        }
      }

      alert("Cadastro e classificação salvos com sucesso.");
      router.push(`/creators/detail?creator_id=${creatorId}`);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar cadastro.");
    }

    setSavingCadastro(false);
  };

  const handleSaveMetricas = async () => {
    if (!empresaId || !creatorId) {
      alert("Empresa ou creator não encontrado.");
      return;
    }

    setSavingMetricas(true);

    try {
      const captacaoId = await getCaptacaoId();

      if (captacaoId) {
        const { error } = await supabase
          .from("creator_captacao")
          .update({
            seguidores: parseNullableNumber(seguidores),
            curtidas_medias: parseNullableNumber(curtidasMedias),
            comentarios_medios: parseNullableNumber(comentariosMedios),
            atualizado_em: new Date().toISOString(),
          })
          .eq("captacao_id", captacaoId)
          .eq("empresa_id", empresaId);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { error } = await supabase.from("creator_captacao").insert([
          {
            creator_id: creatorId,
            empresa_id: empresaId,
            seguidores: parseNullableNumber(seguidores),
            curtidas_medias: parseNullableNumber(curtidasMedias),
            comentarios_medios: parseNullableNumber(comentariosMedios),
            atualizado_em: new Date().toISOString(),
          },
        ]);

        if (error) {
          throw new Error(error.message);
        }
      }

      alert("Métricas salvas com sucesso.");
      router.push(`/creators/detail?creator_id=${creatorId}`);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar métricas.");
    }

    setSavingMetricas(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: "760px" }}>
        <div style={{ marginBottom: "12px" }}>
          <a
            href={`/creators/detail?creator_id=${creatorId}`}
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

        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
          Editar Creator
        </h1>

        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            display: "grid",
            gap: "16px",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "8px",
              marginBottom: "4px",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
              Cadastro e classificação
            </h2>
          </div>

          <div style={grid2}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={inputStyle}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label style={labelStyle}>Instagram</label>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                style={inputStyle}
                placeholder="@perfil"
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <input
                value={formatStatus(status)}
                style={{ ...inputStyle, background: "#f8fafc", color: "#6b7280" }}
                disabled
              />
              <div style={helperTextStyle}>
                Status automático pela avaliação / score fit.
              </div>
            </div>

            <div>
              <label style={labelStyle}>Tipo</label>
              <input
                value={tipoCreator || ""}
                style={{ ...inputStyle, background: "#f8fafc", color: "#6b7280" }}
                disabled
                placeholder="Será calculado automaticamente"
              />
              <div style={helperTextStyle}>
                Tipo automático conforme a quantidade de seguidores.
              </div>
            </div>

            <div>
              <label style={labelStyle}>Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                {categorias.map((categoria) => (
                  <option key={categoria.categoria_id} value={categoria.categoria_id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Segmento</label>
              <select
                value={segmentoId}
                onChange={(e) => handleSegmentoChange(e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecione</option>
                {segmentosFiltrados.map((segmento) => (
                  <option key={segmento.segmento_id} value={segmento.segmento_id}>
                    {segmento.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Área speaker</label>
              <select
                value={areaSpeakerId}
                onChange={(e) => setAreaSpeakerId(e.target.value)}
                style={inputStyle}
                disabled={!segmentoId}
              >
                <option value="">Selecione</option>
                {areasFiltradas.map((area) => (
                  <option key={area.area_speaker_id} value={area.area_speaker_id}>
                    {area.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              onClick={handleSaveCadastro}
              disabled={savingCadastro}
              style={primaryButton}
            >
              {savingCadastro ? "Salvando..." : "Salvar cadastro"}
            </button>
          </div>

          <div
            style={{
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "8px",
              marginBottom: "4px",
              marginTop: "8px",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
              Análise de perfil
            </h2>
          </div>

          <div style={grid2}>
            <div>
              <label style={labelStyle}>Seguidores</label>
              <input
                value={seguidores}
                onChange={(e) => setSeguidores(e.target.value)}
                style={inputStyle}
                placeholder="Ex: 35040"
                inputMode="numeric"
              />
            </div>

            <div>
              <label style={labelStyle}>Engajamento (%)</label>
              <input
                value={engajamento}
                style={{ ...inputStyle, background: "#f8fafc", color: "#6b7280" }}
                disabled
                placeholder="Calculado automaticamente"
              />
              <div style={helperTextStyle}>
                Engajamento automático. Não é salvo manualmente nesta etapa.
              </div>
            </div>

            <div>
              <label style={labelStyle}>Curtidas médias</label>
              <input
                value={curtidasMedias}
                onChange={(e) => setCurtidasMedias(e.target.value)}
                style={inputStyle}
                placeholder="Ex: 520"
                inputMode="numeric"
              />
            </div>

            <div>
              <label style={labelStyle}>Comentários médios</label>
              <input
                value={comentariosMedios}
                onChange={(e) => setComentariosMedios(e.target.value)}
                style={inputStyle}
                placeholder="Ex: 35"
                inputMode="numeric"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              onClick={handleSaveMetricas}
              disabled={savingMetricas}
              style={primaryButton}
            >
              {savingMetricas ? "Salvando..." : "Salvar métricas"}
            </button>

            <button
              onClick={() => router.push(`/creators/detail?creator_id=${creatorId}`)}
              style={secondaryButton}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#374151",
  marginBottom: "4px",
};

const helperTextStyle = {
  fontSize: "11px",
  color: "#6b7280",
  marginTop: "4px",
};

const inputStyle = {
  width: "100%",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  fontSize: "13px",
  boxSizing: "border-box" as const,
  background: "white",
};

const primaryButton = {
  borderRadius: "8px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  padding: "10px 14px",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
};

const secondaryButton = {
  borderRadius: "8px",
  background: "white",
  padding: "10px 14px",
  color: "#111827",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
};