"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabaseClient";

type Creator = {
  creator_id: string;
  empresa_id: string;
  nome: string | null;
  instagram: string | null;
  status: string | null;
  score_total: number | null;
  score_parcial: number | null;
  criado_em: string | null;
  foto_url: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  segmento_nome: string | null;
  area_speaker_nome: string | null;
  seguidores: number | null;
  engajamento: number | null;
};

type UsuarioEmpresa = {
  empresa_id: string;
  perfil: string | null;
  perfil_acesso_id: string | null;
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

type PermissaoCreators = {
  pode_acessar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type PermissaoFinal = {
  podeAcessar: boolean;
  podeCriar: boolean;
  podeEditar: boolean;
};

type ViewMode = "cards" | "kanban" | "lista";

export default function CreatorsPage() {
  const router = useRouter();

  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [loading, setLoading] = useState(true);

  const [podeCriar, setPodeCriar] = useState(false);
  const [podeEditar, setPodeEditar] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [segmentoId, setSegmentoId] = useState("");
  const [areaSpeakerId, setAreaSpeakerId] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [areasSpeaker, setAreasSpeaker] = useState<AreaSpeaker[]>([]);

  const getPermissoesFallback = (perfil: string | null): PermissaoFinal => {
    if (perfil === "admin") {
      return {
        podeAcessar: true,
        podeCriar: true,
        podeEditar: true,
      };
    }

    if (perfil === "suporte") {
      return {
        podeAcessar: true,
        podeCriar: true,
        podeEditar: true,
      };
    }

    if (perfil === "terceirizado") {
      return {
        podeAcessar: true,
        podeCriar: false,
        podeEditar: false,
      };
    }

    return {
      podeAcessar: false,
      podeCriar: false,
      podeEditar: false,
    };
  };

  const buscarPermissoesCreators = async (
    perfilAcessoId: string | null,
    perfilLegado: string | null,
  ): Promise<PermissaoFinal> => {
    if (!perfilAcessoId) {
      return getPermissoesFallback(perfilLegado);
    }

    const { data, error } = await supabase
      .from("perfil_acesso_permissoes")
      .select("pode_acessar, pode_criar, pode_editar, pode_excluir")
      .eq("perfil_acesso_id", perfilAcessoId)
      .eq("pagina_key", "creators")
      .maybeSingle<PermissaoCreators>();

    if (error) {
      console.error("Erro ao buscar permissões de creators:", error);
      return getPermissoesFallback(perfilLegado);
    }

    return {
      podeAcessar: Boolean(data?.pode_acessar),
      podeCriar: Boolean(data?.pode_acessar && data?.pode_criar),
      podeEditar: Boolean(data?.pode_acessar && data?.pode_editar),
    };
  };

  const loadCreators = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/");
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id, perfil, perfil_acesso_id")
        .eq("usuario_id", session.user.id)
        .single<UsuarioEmpresa>();

      if (usuarioError || !usuario?.empresa_id) {
        console.error("Erro ao buscar empresa do usuário:", usuarioError);
        setCreators([]);
        router.push("/perfil");
        return;
      }

      const permissoes = await buscarPermissoesCreators(
        usuario.perfil_acesso_id,
        usuario.perfil,
      );

      if (!permissoes.podeAcessar) {
        alert("Você não tem permissão para acessar creators.");
        router.push("/dashboard");
        return;
      }

      setPodeCriar(permissoes.podeCriar);
      setPodeEditar(permissoes.podeEditar);
      setEmpresaId(usuario.empresa_id);

      const [creatorsRes, categoriasRes, segmentosRes, areasRes] =
        await Promise.all([
          supabase
            .from("v_creator_detalhe")
            .select(
              "creator_id, empresa_id, nome, instagram, status, score_total, score_parcial, criado_em, foto_url, categoria_id, categoria_nome, segmento_nome, area_speaker_nome, seguidores, engajamento",
            )
            .eq("empresa_id", usuario.empresa_id)
            .order("criado_em", { ascending: false }),

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
        ]);

      if (creatorsRes.error) {
        console.error("Erro ao buscar creators:", creatorsRes.error);
        setCreators([]);
      } else {
        setCreators((creatorsRes.data as Creator[]) || []);
      }

      if (categoriasRes.error) {
        console.error("Erro ao buscar categorias:", categoriasRes.error);
        setCategorias([]);
      } else {
        setCategorias((categoriasRes.data as Categoria[]) || []);
      }

      if (segmentosRes.error) {
        console.error("Erro ao buscar segmentos:", segmentosRes.error);
        setSegmentos([]);
      } else {
        setSegmentos((segmentosRes.data as Segmento[]) || []);
      }

      if (areasRes.error) {
        console.error("Erro ao buscar áreas speaker:", areasRes.error);
        setAreasSpeaker([]);
      } else {
        setAreasSpeaker((areasRes.data as AreaSpeaker[]) || []);
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar creators:", err);
      alert("Erro de conexão ao carregar creators.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(loadCreators, 300);
  }, []);

  const segmentosFiltrados = useMemo(() => {
    if (!categoriaId) return segmentos;
    return segmentos.filter((segmento) => segmento.categoria_id === categoriaId);
  }, [segmentos, categoriaId]);

  const areasFiltradas = useMemo(() => {
    if (!segmentoId) return [];
    return areasSpeaker.filter((area) => area.segmento_id === segmentoId);
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

  const resetModalFields = () => {
    setNome("");
    setInstagram("");
    setCategoriaId("");
    setSegmentoId("");
    setAreaSpeakerId("");
  };

  const handleOpenModal = () => {
    if (!podeCriar) {
      alert("Você não tem permissão para cadastrar creator.");
      return;
    }

    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetModalFields();
    setOpenModal(false);
  };

  const handleCreateCreator = async () => {
    if (!podeCriar) {
      alert("Você não tem permissão para cadastrar creator.");
      return;
    }

    if (!nome.trim() || !instagram.trim()) {
      alert("Preencha nome e instagram.");
      return;
    }

    if (!empresaId) {
      alert("Empresa não encontrada.");
      return;
    }

    try {
      setSaving(true);

      const instagramLimpo = instagram.replaceAll("@", "").trim();

      const { data: creatorCriado, error: creatorError } = await supabase
        .from("creators")
        .insert([
          {
            nome: nome.trim(),
            instagram: instagramLimpo,
            empresa_id: empresaId,
            categoria_id: categoriaId || null,
          },
        ])
        .select("creator_id")
        .single();

      if (creatorError || !creatorCriado?.creator_id) {
        alert(creatorError?.message || "Erro ao cadastrar creator.");
        return;
      }

      if (segmentoId || areaSpeakerId) {
        const { error: captacaoError } = await supabase
          .from("creator_captacao")
          .insert([
            {
              creator_id: creatorCriado.creator_id,
              empresa_id: empresaId,
              segmento_id: segmentoId || null,
              area_speaker_id: areaSpeakerId || null,
              atualizado_em: new Date().toISOString(),
            },
          ]);

        if (captacaoError) {
          alert(captacaoError.message);
          return;
        }
      }

      resetModalFields();
      setOpenModal(false);
      await loadCreators();
    } catch (err) {
      console.error("Erro inesperado ao cadastrar creator:", err);
      alert("Erro de conexão ao cadastrar creator.");
    } finally {
      setSaving(false);
    }
  };

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      const nome = (c.nome || "").toLowerCase();
      const instagram = (c.instagram || "").toLowerCase();
      const categoria = (c.categoria_nome || "").toLowerCase();
      const segmento = (c.segmento_nome || "").toLowerCase();
      const area = (c.area_speaker_nome || "").toLowerCase();
      const term = search.toLowerCase();

      const matchesSearch =
        !term ||
        nome.includes(term) ||
        instagram.includes(term) ||
        categoria.includes(term) ||
        segmento.includes(term) ||
        area.includes(term);

      const matchesStatus =
        statusFilter === "Todos os status" ||
        (c.status || "em_analise").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [creators, search, statusFilter]);

  const statuses = useMemo(() => {
    const unique = Array.from(
      new Set(creators.map((c) => c.status || "em_analise").filter(Boolean)),
    ) as string[];

    return ["Todos os status", ...unique];
  }, [creators]);

  const kanbanColumns = useMemo(() => {
    return [
      { key: "em_analise", label: "Em análise" },
      { key: "potencial", label: "Potencial" },
      { key: "aprovado", label: "Aprovado" },
      { key: "reprovado", label: "Reprovado" },
    ];
  }, []);

  const getScore = (creator: Creator) => {
    if (creator.score_parcial !== null && creator.score_parcial !== undefined) {
      return creator.score_parcial;
    }

    if (creator.score_total !== null && creator.score_total !== undefined) {
      return creator.score_total;
    }

    return null;
  };

  const formatScore = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatStatus = (status: string | null) => {
    if (status === "aprovado") return "Aprovado";
    if (status === "potencial") return "Potencial";
    if (status === "reprovado") return "Reprovado";
    if (status === "em_analise") return "Em análise";
    return "Em análise";
  };

  const getInitials = (name: string | null) => {
    if (!name) return "C";

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const statusBadgeStyle = (status: string | null) => ({
    fontSize: "12px",
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "6px",
    background:
      status === "aprovado"
        ? "#dcfce7"
        : status === "reprovado"
          ? "#fee2e2"
          : status === "potencial"
            ? "#dbeafe"
            : "#fef9c3",
    color:
      status === "aprovado"
        ? "#166534"
        : status === "reprovado"
          ? "#991b1b"
          : status === "potencial"
            ? "#1d4ed8"
            : "#854d0e",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  });

  const kanbanColumnStyle = (status: string) => ({
    background:
      status === "aprovado"
        ? "#f0fdf4"
        : status === "reprovado"
          ? "#fef2f2"
          : status === "potencial"
            ? "#eff6ff"
            : "#fefce8",
    border:
      status === "aprovado"
        ? "1px solid #bbf7d0"
        : status === "reprovado"
          ? "1px solid #fecaca"
          : status === "potencial"
            ? "1px solid #bfdbfe"
            : "1px solid #fde68a",
    borderRadius: "12px",
    padding: "10px",
    minWidth: "220px",
  });

  const kanbanColumnTitleStyle = (status: string) => ({
    fontSize: "13px",
    fontWeight: 700,
    color:
      status === "aprovado"
        ? "#166534"
        : status === "reprovado"
          ? "#991b1b"
          : status === "potencial"
            ? "#1d4ed8"
            : "#854d0e",
  });

  const renderActionLinks = (creatorId: string) => {
    return (
      <>
        <a
          href={`/creators/detail?creator_id=${creatorId}`}
          style={{
            fontSize: "11px",
            color: "#0f766e",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Ver detalhes
        </a>

        {podeEditar && (
          <a
            href={`/creators/avaliar?creator_id=${creatorId}`}
            style={{
              fontSize: "11px",
              color: "#1d4ed8",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Avaliar
          </a>
        )}

        {podeEditar && (
          <a
            href={`/creators/edit?creator_id=${creatorId}`}
            style={{
              fontSize: "11px",
              color: "#0f766e",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Editar
          </a>
        )}
      </>
    );
  };

  const renderCreatorCard = (c: Creator) => {
    const score = getScore(c);

    return (
      <div
        key={c.creator_id}
        style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px",
          border: "1px solid #e5e7eb",
          color: "inherit",
          display: "block",
        }}
      >
        <a
          href={`/creators/detail?creator_id=${c.creator_id}`}
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "block",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "999px",
                background: "#ccfbf1",
                color: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {getInitials(c.nome)}
            </div>

            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: "14px",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.nome || "Sem nome"}
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                @{c.instagram || "-"}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <div style={metricBox}>
              <div style={metricLabel}>Categoria</div>
              <div style={metricValue}>{c.categoria_nome || "-"}</div>
            </div>

            <div style={metricBox}>
              <div style={metricLabel}>Score Fit</div>
              <div style={metricValue}>{formatScore(score)}</div>
            </div>

            <div style={metricBox}>
              <div style={metricLabel}>Segmento</div>
              <div style={metricValue}>{c.segmento_nome || "-"}</div>
            </div>

            <div style={metricBox}>
              <div style={metricLabel}>Área speaker</div>
              <div style={metricValue}>{c.area_speaker_nome || "-"}</div>
            </div>

            <div style={metricBox}>
              <div style={metricLabel}>Seguidores</div>
              <div style={metricValue}>
                {c.seguidores !== null && c.seguidores !== undefined
                  ? c.seguidores.toLocaleString("pt-BR")
                  : "-"}
              </div>
            </div>

            <div style={metricBox}>
              <div style={metricLabel}>Engajamento</div>
              <div style={metricValue}>
                {c.engajamento !== null && c.engajamento !== undefined
                  ? `${c.engajamento}%`
                  : "-"}
              </div>
            </div>
          </div>
        </a>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={statusBadgeStyle(c.status)}>{formatStatus(c.status)}</div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {renderActionLinks(c.creator_id)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div style={{ background: "#f5f5f6" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              Creators
            </h1>

            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginTop: "6px",
              }}
            >
              {loading
                ? "Carregando creators..."
                : `${filteredCreators.length} creators cadastrados`}
            </p>
          </div>

          {podeCriar && (
            <button
              onClick={handleOpenModal}
              style={{
                background: "linear-gradient(to right, #0f766e, #14b8a6)",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow: "0 4px 10px rgba(20, 184, 166, 0.18)",
                display: "inline-block",
              }}
            >
              + Novo Creator
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <input
            placeholder="Buscar por nome, Instagram, categoria ou segmento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "white",
              fontSize: "13px",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterStyle}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "Todos os status" ? status : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>
            Formato de visualização:
          </span>

          <button
            onClick={() => setViewMode("cards")}
            style={{
              ...viewButton,
              ...(viewMode === "cards" ? activeViewButton : {}),
            }}
          >
            Cards
          </button>

          <button
            onClick={() => setViewMode("kanban")}
            style={{
              ...viewButton,
              ...(viewMode === "kanban" ? activeViewButton : {}),
            }}
          >
            Kanban
          </button>

          <button
            onClick={() => setViewMode("lista")}
            style={{
              ...viewButton,
              ...(viewMode === "lista" ? activeViewButton : {}),
            }}
          >
            Lista
          </button>
        </div>

        {loading ? (
          <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
        ) : filteredCreators.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: "14px" }}>
            Nenhum creator encontrado.
          </div>
        ) : viewMode === "cards" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredCreators.map((c) => renderCreatorCard(c))}
          </div>
        ) : viewMode === "kanban" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: "12px",
              alignItems: "start",
              overflowX: "auto",
            }}
          >
            {kanbanColumns.map((column) => {
              const items = filteredCreators.filter(
                (creator) => (creator.status || "em_analise") === column.key,
              );

              return (
                <div key={column.key} style={kanbanColumnStyle(column.key)}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <div style={kanbanColumnTitleStyle(column.key)}>
                      {column.label}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "999px",
                        padding: "2px 7px",
                      }}
                    >
                      {items.length}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "8px" }}>
                    {items.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Nenhum creator.
                      </div>
                    ) : (
                      items.map((creator) => {
                        const score = getScore(creator);

                        return (
                          <div
                            key={creator.creator_id}
                            style={{
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "10px",
                            }}
                          >
                            <a
                              href={`/creators/detail?creator_id=${creator.creator_id}`}
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                            >
                              <div style={{ fontSize: "13px", fontWeight: 700 }}>
                                {creator.nome || "Sem nome"}
                              </div>

                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  marginTop: "2px",
                                }}
                              >
                                @{creator.instagram || "-"}
                              </div>

                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  marginTop: "8px",
                                }}
                              >
                                {creator.categoria_nome || "-"} /{" "}
                                {creator.segmento_nome ||
                                  creator.area_speaker_nome ||
                                  "-"}
                              </div>

                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#111827",
                                  fontWeight: 700,
                                  marginTop: "6px",
                                }}
                              >
                                Score Fit: {formatScore(score)}
                              </div>
                            </a>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                marginTop: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <a
                                href={`/creators/detail?creator_id=${creator.creator_id}`}
                                style={{
                                  fontSize: "11px",
                                  color: "#0f766e",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                }}
                              >
                                Ver
                              </a>

                              {podeEditar && (
                                <a
                                  href={`/creators/avaliar?creator_id=${creator.creator_id}`}
                                  style={{
                                    fontSize: "11px",
                                    color: "#1d4ed8",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                  }}
                                >
                                  Avaliar
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div style={tableHeader}>
              <span>CREATOR</span>
              <span>STATUS</span>
              <span>SCORE</span>
              <span>CATEGORIA</span>
              <span>SEGMENTO</span>
              <span>AÇÕES</span>
            </div>

            {filteredCreators.map((creator) => {
              const score = getScore(creator);

              return (
                <div key={creator.creator_id} style={tableRow}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#111827" }}>
                      {creator.nome || "Sem nome"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      @{creator.instagram || "-"}
                    </div>
                  </div>

                  <div>
                    <span style={statusBadgeStyle(creator.status)}>
                      {formatStatus(creator.status)}
                    </span>
                  </div>

                  <div>{formatScore(score)}</div>

                  <div>{creator.categoria_nome || "-"}</div>

                  <div>
                    {creator.segmento_nome || creator.area_speaker_nome || "-"}
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <a
                      href={`/creators/detail?creator_id=${creator.creator_id}`}
                      style={tableLinkPrimary}
                    >
                      Ver
                    </a>

                    {podeEditar && (
                      <a
                        href={`/creators/avaliar?creator_id=${creator.creator_id}`}
                        style={tableLinkBlue}
                      >
                        Avaliar
                      </a>
                    )}

                    {podeEditar && (
                      <a
                        href={`/creators/edit?creator_id=${creator.creator_id}`}
                        style={tableLinkPrimary}
                      >
                        Editar
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {openModal && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Novo Creator
                </h3>

                <button onClick={handleCloseModal} style={closeButtonStyle}>
                  ×
                </button>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Instagram</label>
                  <input
                    placeholder="@perfil"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    style={inputStyle}
                  />
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
                      <option
                        key={categoria.categoria_id}
                        value={categoria.categoria_id}
                      >
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
                      <option
                        key={area.area_speaker_id}
                        value={area.area_speaker_id}
                      >
                        {area.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateCreator}
                  disabled={saving}
                  style={saveButtonStyle}
                >
                  {saving ? "Salvando..." : "Cadastrar Creator"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const metricBox = {
  background: "#f3f4f6",
  borderRadius: "8px",
  padding: "8px",
};

const metricLabel = {
  fontSize: "11px",
  color: "#6b7280",
  marginBottom: "2px",
};

const metricValue = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#111827",
};

const filterStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "white",
  fontSize: "13px",
};

const viewButton = {
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#6b7280",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const activeViewButton = {
  background: "#ccfbf1",
  color: "#0f766e",
  border: "1px solid #14b8a6",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "1.6fr 0.9fr 0.7fr 1fr 1fr 1fr",
  gap: "10px",
  padding: "10px 12px",
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "11px",
  fontWeight: 700,
  color: "#6b7280",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1.6fr 0.9fr 0.7fr 1fr 1fr 1fr",
  gap: "10px",
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: "12px",
  color: "#374151",
  alignItems: "center",
};

const tableLinkPrimary = {
  fontSize: "11px",
  color: "#0f766e",
  fontWeight: 700,
  textDecoration: "none",
};

const tableLinkBlue = {
  fontSize: "11px",
  color: "#1d4ed8",
  fontWeight: 700,
  textDecoration: "none",
};

const overlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  border: "1px solid #e5e7eb",
};

const closeButtonStyle = {
  background: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#6b7280",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#374151",
  marginBottom: "4px",
};

const inputStyle = {
  width: "100%",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  fontSize: "13px",
  boxSizing: "border-box" as const,
};

const saveButtonStyle = {
  width: "100%",
  borderRadius: "8px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  padding: "10px 12px",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
};
