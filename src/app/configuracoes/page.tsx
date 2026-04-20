"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabaseClient";

type UsuarioEmpresa = {
  empresa_id: string;
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

export default function ConfiguracoesPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [savingCategoria, setSavingCategoria] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");

  const [loadingSegmentos, setLoadingSegmentos] = useState(true);
  const [savingSegmento, setSavingSegmento] = useState(false);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [novoSegmento, setNovoSegmento] = useState("");
  const [categoriaSegmentoId, setCategoriaSegmentoId] = useState("");

  const [loadingAreas, setLoadingAreas] = useState(true);
  const [savingArea, setSavingArea] = useState(false);
  const [areasSpeaker, setAreasSpeaker] = useState<AreaSpeaker[]>([]);
  const [novaArea, setNovaArea] = useState("");
  const [segmentoAreaId, setSegmentoAreaId] = useState("");

  const loadCategorias = async (empresaIdParam?: string) => {
    const empresa = empresaIdParam || empresaId;
    if (!empresa) return;

    setLoadingCategorias(true);

    const { data, error } = await supabase
      .from("categorias")
      .select("categoria_id, nome")
      .eq("empresa_id", empresa)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao buscar categorias:", error);
      setCategorias([]);
    } else {
      setCategorias((data as Categoria[]) || []);
    }

    setLoadingCategorias(false);
  };

  const loadSegmentos = async (empresaIdParam?: string) => {
    const empresa = empresaIdParam || empresaId;
    if (!empresa) return;

    setLoadingSegmentos(true);

    const { data, error } = await supabase
      .from("segmentos")
      .select("segmento_id, nome, categoria_id")
      .eq("empresa_id", empresa)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao buscar segmentos:", error);
      setSegmentos([]);
    } else {
      setSegmentos((data as Segmento[]) || []);
    }

    setLoadingSegmentos(false);
  };

  const loadAreas = async (empresaIdParam?: string) => {
    const empresa = empresaIdParam || empresaId;
    if (!empresa) return;

    setLoadingAreas(true);

    const { data, error } = await supabase
      .from("areas_speaker")
      .select("area_speaker_id, nome, segmento_id")
      .eq("empresa_id", empresa)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao buscar áreas:", error);
      setAreasSpeaker([]);
    } else {
      setAreasSpeaker((data as AreaSpeaker[]) || []);
    }

    setLoadingAreas(false);
  };

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoadingCategorias(false);
      setLoadingSegmentos(false);
      setLoadingAreas(false);
      return;
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("usuario_id", session.user.id)
      .single<UsuarioEmpresa>();

    if (usuarioError || !usuario?.empresa_id) {
      console.error("Erro ao buscar empresa do usuário:", usuarioError);
      setLoadingCategorias(false);
      setLoadingSegmentos(false);
      setLoadingAreas(false);
      return;
    }

    setEmpresaId(usuario.empresa_id);

    await Promise.all([
      loadCategorias(usuario.empresa_id),
      loadSegmentos(usuario.empresa_id),
      loadAreas(usuario.empresa_id),
    ]);
  };

  useEffect(() => {
    setTimeout(loadData, 300);
  }, []);

  const handleCreateCategoria = async () => {
    if (!novaCategoria.trim()) {
      alert("Digite o nome da categoria.");
      return;
    }

    if (!empresaId) {
      alert("Empresa não encontrada.");
      return;
    }

    setSavingCategoria(true);

    const { error } = await supabase.from("categorias").insert([
      {
        empresa_id: empresaId,
        nome: novaCategoria.trim(),
      },
    ]);

    setSavingCategoria(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNovaCategoria("");
    await loadCategorias();
  };

  const handleCreateSegmento = async () => {
    if (!novoSegmento.trim()) {
      alert("Digite o nome do segmento.");
      return;
    }

    if (!categoriaSegmentoId) {
      alert("Selecione a categoria do segmento.");
      return;
    }

    if (!empresaId) {
      alert("Empresa não encontrada.");
      return;
    }

    setSavingSegmento(true);

    const { error } = await supabase.from("segmentos").insert([
      {
        empresa_id: empresaId,
        nome: novoSegmento.trim(),
        categoria_id: categoriaSegmentoId,
      },
    ]);

    setSavingSegmento(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNovoSegmento("");
    setCategoriaSegmentoId("");
    await loadSegmentos();
  };

  const handleCreateArea = async () => {
    if (!novaArea.trim()) {
      alert("Digite o nome da área.");
      return;
    }

    if (!segmentoAreaId) {
      alert("Selecione o segmento.");
      return;
    }

    if (!empresaId) {
      alert("Empresa não encontrada.");
      return;
    }

    setSavingArea(true);

    const { error } = await supabase.from("areas_speaker").insert([
      {
        empresa_id: empresaId,
        nome: novaArea.trim(),
        segmento_id: segmentoAreaId,
      },
    ]);

    setSavingArea(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNovaArea("");
    setSegmentoAreaId("");
    await loadAreas();
  };

  const segmentosComCategoria = useMemo(() => {
    return segmentos.map((segmento) => {
      const categoria = categorias.find(
        (c) => c.categoria_id === segmento.categoria_id
      );

      return {
        ...segmento,
        categoriaNome: categoria?.nome || "-",
      };
    });
  }, [segmentos, categorias]);

  const areasComSegmento = useMemo(() => {
    return areasSpeaker.map((area) => {
      const segmento = segmentos.find(
        (s) => s.segmento_id === area.segmento_id
      );

      return {
        ...area,
        segmentoNome: segmento?.nome || "-",
      };
    });
  }, [areasSpeaker, segmentos]);

  return (
    <AppLayout>
      <div style={{ maxWidth: "760px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Configurações</h1>
          <p style={subtitle}>Gerencie as configurações da sua empresa</p>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>🏢 Empresa</h3>

          <div style={grid2}>
            <div>
              <label style={label}>Nome da empresa</label>
              <input style={input} defaultValue="Funcionow Ltda" />
            </div>

            <div>
              <label style={label}>E-mail de contato</label>
              <input style={input} defaultValue="contato@funcionow.com" />
            </div>

            <div>
              <label style={label}>Website</label>
              <input style={input} defaultValue="https://funcionow.com" />
            </div>

            <div>
              <label style={label}>Segmento</label>
              <input style={input} defaultValue="SaaS e Influencer" />
            </div>
          </div>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>🗂️ Categorias</h3>

          <div style={rowForm}>
            <input
              style={input}
              placeholder="Ex: Fitness"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
            />

            <button
              onClick={handleCreateCategoria}
              disabled={savingCategoria}
              style={saveButton}
            >
              {savingCategoria ? "Salvando..." : "Adicionar categoria"}
            </button>
          </div>

          <div style={{ marginTop: "14px" }}>
            {loadingCategorias ? (
              <div style={emptyText}>Carregando categorias...</div>
            ) : categorias.length === 0 ? (
              <div style={emptyText}>Nenhuma categoria cadastrada.</div>
            ) : (
              <div style={list}>
                {categorias.map((categoria) => (
                  <div key={categoria.categoria_id} style={listItem}>
                    <span>{categoria.nome}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>🧩 Segmentos</h3>

          <div style={grid2}>
            <div>
              <label style={label}>Nome do segmento</label>
              <input
                style={input}
                placeholder="Ex: Academia"
                value={novoSegmento}
                onChange={(e) => setNovoSegmento(e.target.value)}
              />
            </div>

            <div>
              <label style={label}>Categoria do segmento</label>
              <select
                style={input}
                value={categoriaSegmentoId}
                onChange={(e) => setCategoriaSegmentoId(e.target.value)}
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
          </div>

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleCreateSegmento}
              disabled={savingSegmento}
              style={saveButton}
            >
              {savingSegmento ? "Salvando..." : "Adicionar segmento"}
            </button>
          </div>

          <div style={{ marginTop: "14px" }}>
            {loadingSegmentos ? (
              <div style={emptyText}>Carregando segmentos...</div>
            ) : segmentosComCategoria.length === 0 ? (
              <div style={emptyText}>Nenhum segmento cadastrado.</div>
            ) : (
              <div style={list}>
                {segmentosComCategoria.map((segmento) => (
                  <div key={segmento.segmento_id} style={listItem}>
                    <span>
                      {segmento.nome}{" "}
                      <span style={{ color: "#6b7280" }}>
                        — {segmento.categoriaNome}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>🎤 Áreas Speaker</h3>

          <div style={grid2}>
            <div>
              <label style={label}>Nome da área</label>
              <input
                style={input}
                placeholder="Ex: Treino funcional"
                value={novaArea}
                onChange={(e) => setNovaArea(e.target.value)}
              />
            </div>

            <div>
              <label style={label}>Segmento</label>
              <select
                style={input}
                value={segmentoAreaId}
                onChange={(e) => setSegmentoAreaId(e.target.value)}
              >
                <option value="">Selecione</option>
                {segmentos.map((segmento) => (
                  <option key={segmento.segmento_id} value={segmento.segmento_id}>
                    {segmento.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleCreateArea}
              disabled={savingArea}
              style={saveButton}
            >
              {savingArea ? "Salvando..." : "Adicionar área"}
            </button>
          </div>

          <div style={{ marginTop: "14px" }}>
            {loadingAreas ? (
              <div style={emptyText}>Carregando áreas...</div>
            ) : areasComSegmento.length === 0 ? (
              <div style={emptyText}>Nenhuma área cadastrada.</div>
            ) : (
              <div style={list}>
                {areasComSegmento.map((area) => (
                  <div key={area.area_speaker_id} style={listItem}>
                    <span>
                      {area.nome}{" "}
                      <span style={{ color: "#6b7280" }}>
                        — {area.segmentoNome}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>🔔 Notificações</h3>

          <div style={toggleRow}>
            <span>Novos creators cadastrados</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Creators aprovados/reprovados</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Relatórios semanais</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Campanhas finalizadas</span>
            <Toggle defaultOn />
          </div>

          <div style={toggleRow}>
            <span>Alertas de performance</span>
            <Toggle defaultOn />
          </div>
        </div>

        <div style={card}>
          <h3 style={sectionTitle}>🔒 Segurança</h3>

          <div style={grid2}>
            <div>
              <label style={label}>Senha atual</label>
              <input style={input} type="password" defaultValue="********" />
            </div>

            <div>
              <label style={label}>Nova senha</label>
              <input style={input} type="password" />
            </div>
          </div>
        </div>

        <button style={saveButton}>Salvar Configurações</button>
      </div>
    </AppLayout>
  );
}

function Toggle({ defaultOn = false }) {
  return (
    <div
      style={{
        width: "36px",
        height: "18px",
        borderRadius: "999px",
        background: defaultOn ? "#14b8a6" : "#e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: "2px",
        justifyContent: defaultOn ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "999px",
          background: "white",
        }}
      />
    </div>
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
  padding: "14px",
  marginBottom: "12px",
};

const sectionTitle = {
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "12px",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const rowForm = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "10px",
  alignItems: "center",
};

const label = {
  fontSize: "10px",
  color: "#6b7280",
  display: "block",
  marginBottom: "4px",
};

const input = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "12px",
  boxSizing: "border-box" as const,
};

const toggleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "12px",
  padding: "6px 0",
};

const saveButton = {
  background: "#14b8a6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const emptyText = {
  fontSize: "12px",
  color: "#6b7280",
};

const list = {
  display: "grid",
  gap: "8px",
};

const listItem = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "12px",
  background: "#fafafa",
};