"use client";

import { useEffect, useMemo, useState } from "react";
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
};

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");

  const loadCreators = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setCreators([]);
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
      setCreators([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("v_creator_detalhe")
      .select(
        "creator_id, empresa_id, nome, instagram, status, score_total, score_parcial, criado_em, foto_url, categoria_id, categoria_nome, segmento_nome, area_speaker_nome, seguidores, engajamento"
      )
      .eq("empresa_id", usuario.empresa_id)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao buscar creators:", error);
      setCreators([]);
    } else {
      setCreators((data as Creator[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    setTimeout(loadCreators, 300);
  }, []);

  const handleCreateCreator = async () => {
    if (!nome.trim() || !instagram.trim()) {
      alert("Preencha nome e instagram.");
      return;
    }

    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      alert("Usuário não autenticado");
      setSaving(false);
      return;
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("usuario_id", user.id)
      .single<UsuarioEmpresa>();

    if (usuarioError || !usuario?.empresa_id) {
      alert("Erro ao buscar empresa do usuário");
      setSaving(false);
      return;
    }

    const instagramLimpo = instagram.replace("@", "").trim();

    const { error } = await supabase.from("creators").insert([
      {
        nome: nome.trim(),
        instagram: instagramLimpo,
        empresa_id: usuario.empresa_id,
      },
    ]);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNome("");
    setInstagram("");
    setOpenModal(false);
    await loadCreators();
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
        (c.status || "em_analise").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [creators, search, statusFilter]);

  const statuses = useMemo(() => {
    const unique = Array.from(
      new Set(creators.map((c) => c.status || "em_analise").filter(Boolean))
    ) as string[];

    return ["Todos os status", ...unique];
  }, [creators]);

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

          <button
            onClick={() => setOpenModal(true)}
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
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
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

        {loading ? (
          <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
        ) : filteredCreators.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: "14px" }}>
            Nenhum creator encontrado.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredCreators.map((c) => {
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
                    <div
                      style={{
                        fontSize: "12px",
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background:
                          c.status === "aprovado"
                            ? "#dcfce7"
                            : c.status === "reprovado"
                            ? "#fee2e2"
                            : c.status === "potencial"
                            ? "#dbeafe"
                            : "#fef9c3",
                        color:
                          c.status === "aprovado"
                            ? "#166534"
                            : c.status === "reprovado"
                            ? "#991b1b"
                            : c.status === "potencial"
                            ? "#1d4ed8"
                            : "#854d0e",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatStatus(c.status)}
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <a
                        href={`/creators/detail?creator_id=${c.creator_id}`}
                        style={{
                          fontSize: "11px",
                          color: "#0f766e",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        Ver detalhes
                      </a>

                      <a
                        href={`/creators/avaliar?creator_id=${c.creator_id}`}
                        style={{
                          fontSize: "11px",
                          color: "#1d4ed8",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Avaliar
                      </a>

                      <a
                        href={`/creators/edit?creator_id=${c.creator_id}`}
                        style={{
                          fontSize: "11px",
                          color: "#0f766e",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Editar
                      </a>
                    </div>
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

                <button
                  onClick={() => setOpenModal(false)}
                  style={closeButtonStyle}
                >
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