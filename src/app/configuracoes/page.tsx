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

type PerfilAcesso = {
  perfil_acesso_id: string;
  empresa_id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  is_admin: boolean;
  sistema: boolean;
  ativo: boolean;
};

type PaginaSistema = {
  pagina_key: string;
  nome: string;
  rota: string;
  ordem: number;
  ativo: boolean;
};

type PermissaoPerfil = {
  perfil_acesso_id: string;
  pagina_key: string;
  pode_acessar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type PermissaoDraft = {
  pode_acessar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

const emptyPermissao: PermissaoDraft = {
  pode_acessar: false,
  pode_criar: false,
  pode_editar: false,
  pode_excluir: false,
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

  const [loadingAcessos, setLoadingAcessos] = useState(true);
  const [savingPermissoes, setSavingPermissoes] = useState(false);
  const [savingNovoPerfil, setSavingNovoPerfil] = useState(false);
  const [perfisAcesso, setPerfisAcesso] = useState<PerfilAcesso[]>([]);
  const [paginasSistema, setPaginasSistema] = useState<PaginaSistema[]>([]);
  const [permissoes, setPermissoes] = useState<PermissaoPerfil[]>([]);
  const [selectedPerfilId, setSelectedPerfilId] = useState("");
  const [permissoesDraft, setPermissoesDraft] = useState<Record<string, PermissaoDraft>>({});
  const [novoPerfilNome, setNovoPerfilNome] = useState("");
  const [novoPerfilDescricao, setNovoPerfilDescricao] = useState("");

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

  const buildDraft = (
    perfilId: string,
    paginas: PaginaSistema[],
    permissoesLista: PermissaoPerfil[],
  ) => {
    const draft: Record<string, PermissaoDraft> = {};

    paginas.forEach((pagina) => {
      const permissao = permissoesLista.find(
        (item) => item.perfil_acesso_id === perfilId && item.pagina_key === pagina.pagina_key,
      );

      draft[pagina.pagina_key] = permissao
        ? {
            pode_acessar: Boolean(permissao.pode_acessar),
            pode_criar: Boolean(permissao.pode_criar),
            pode_editar: Boolean(permissao.pode_editar),
            pode_excluir: Boolean(permissao.pode_excluir),
          }
        : { ...emptyPermissao };
    });

    return draft;
  };

  const loadAcessos = async (empresaIdParam?: string) => {
    const empresa = empresaIdParam || empresaId;
    if (!empresa) return;

    setLoadingAcessos(true);

    const [perfisResponse, paginasResponse, permissoesResponse] = await Promise.all([
      supabase
        .from("perfis_acesso")
        .select("perfil_acesso_id, empresa_id, nome, slug, descricao, is_admin, sistema, ativo")
        .eq("empresa_id", empresa)
        .eq("ativo", true)
        .order("sistema", { ascending: false })
        .order("nome", { ascending: true }),
      supabase
        .from("paginas_sistema")
        .select("pagina_key, nome, rota, ordem, ativo")
        .eq("ativo", true)
        .order("ordem", { ascending: true }),
      supabase
        .from("perfil_acesso_permissoes")
        .select("perfil_acesso_id, pagina_key, pode_acessar, pode_criar, pode_editar, pode_excluir"),
    ]);

    if (perfisResponse.error) {
      console.error("Erro ao buscar perfis de acesso:", perfisResponse.error);
      setPerfisAcesso([]);
    }

    if (paginasResponse.error) {
      console.error("Erro ao buscar páginas do sistema:", paginasResponse.error);
      setPaginasSistema([]);
    }

    if (permissoesResponse.error) {
      console.error("Erro ao buscar permissões:", permissoesResponse.error);
      setPermissoes([]);
    }

    const perfis = ((perfisResponse.data || []) as PerfilAcesso[]).sort((a, b) => {
      const ordemA = getPerfilOrder(a.slug);
      const ordemB = getPerfilOrder(b.slug);
      if (ordemA !== ordemB) return ordemA - ordemB;
      return getPerfilNomeVisual(a).localeCompare(getPerfilNomeVisual(b));
    });

    const paginas = (paginasResponse.data || []) as PaginaSistema[];
    const permissoesLista = (permissoesResponse.data || []) as PermissaoPerfil[];

    setPerfisAcesso(perfis);
    setPaginasSistema(paginas);
    setPermissoes(permissoesLista);

    const perfilSelecionado =
      selectedPerfilId && perfis.some((perfil) => perfil.perfil_acesso_id === selectedPerfilId)
        ? selectedPerfilId
        : perfis[0]?.perfil_acesso_id || "";

    setSelectedPerfilId(perfilSelecionado);
    setPermissoesDraft(perfilSelecionado ? buildDraft(perfilSelecionado, paginas, permissoesLista) : {});

    setLoadingAcessos(false);
  };

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoadingCategorias(false);
      setLoadingSegmentos(false);
      setLoadingAreas(false);
      setLoadingAcessos(false);
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
      setLoadingAcessos(false);
      return;
    }

    setEmpresaId(usuario.empresa_id);

    await Promise.all([
      loadCategorias(usuario.empresa_id),
      loadSegmentos(usuario.empresa_id),
      loadAreas(usuario.empresa_id),
      loadAcessos(usuario.empresa_id),
    ]);
  };

  useEffect(() => {
    setTimeout(loadData, 300);
  }, []);

  useEffect(() => {
    if (!selectedPerfilId || paginasSistema.length === 0) return;
    setPermissoesDraft(buildDraft(selectedPerfilId, paginasSistema, permissoes));
  }, [selectedPerfilId]);

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

  const handleCreatePerfilAcesso = async () => {
    if (!empresaId) {
      alert("Empresa não encontrada.");
      return;
    }

    if (!novoPerfilNome.trim()) {
      alert("Digite o nome do perfil de acesso.");
      return;
    }

    const slug = slugify(novoPerfilNome);

    if (!slug) {
      alert("Nome inválido para perfil de acesso.");
      return;
    }

    try {
      setSavingNovoPerfil(true);

      const { data, error } = await supabase
        .from("perfis_acesso")
        .insert([
          {
            empresa_id: empresaId,
            nome: novoPerfilNome.trim(),
            slug,
            descricao: novoPerfilDescricao.trim() || null,
            is_admin: false,
            sistema: false,
            ativo: true,
          },
        ])
        .select("perfil_acesso_id")
        .single<{ perfil_acesso_id: string }>();

      if (error) {
        alert(error.message);
        return;
      }

      const perfilId = data?.perfil_acesso_id;

      if (perfilId) {
        const perfilPermission = paginasSistema.find((pagina) => pagina.pagina_key === "perfil");

        if (perfilPermission) {
          await supabase.from("perfil_acesso_permissoes").upsert(
            [
              {
                perfil_acesso_id: perfilId,
                pagina_key: "perfil",
                pode_acessar: true,
                pode_criar: false,
                pode_editar: true,
                pode_excluir: false,
              },
            ],
            { onConflict: "perfil_acesso_id,pagina_key" },
          );
        }
      }

      setNovoPerfilNome("");
      setNovoPerfilDescricao("");
      await loadAcessos();
      if (perfilId) setSelectedPerfilId(perfilId);
    } catch (err) {
      console.error("Erro inesperado ao criar perfil de acesso:", err);
      alert("Erro de conexão ao criar perfil de acesso.");
    } finally {
      setSavingNovoPerfil(false);
    }
  };

  const handleTogglePermissao = (paginaKey: string, field: keyof PermissaoDraft) => {
    setPermissoesDraft((current) => {
      const atual = current[paginaKey] || { ...emptyPermissao };
      const atualizado = {
        ...atual,
        [field]: !atual[field],
      };

      if (field !== "pode_acessar" && atualizado[field]) {
        atualizado.pode_acessar = true;
      }

      if (field === "pode_acessar" && !atual.pode_acessar) {
        atualizado.pode_acessar = true;
      }

      if (field === "pode_acessar" && atual.pode_acessar) {
        atualizado.pode_acessar = false;
        atualizado.pode_criar = false;
        atualizado.pode_editar = false;
        atualizado.pode_excluir = false;
      }

      return {
        ...current,
        [paginaKey]: atualizado,
      };
    });
  };

  const handleSalvarPermissoes = async () => {
    if (!selectedPerfilId) {
      alert("Selecione um perfil de acesso.");
      return;
    }

    const selectedPerfil = perfisAcesso.find((perfil) => perfil.perfil_acesso_id === selectedPerfilId);

    if (selectedPerfil?.is_admin) {
      const confirmar = window.confirm(
        "Você está alterando o perfil Administrador. Normalmente ele deve manter acesso total. Deseja continuar?",
      );

      if (!confirmar) return;
    }

    try {
      setSavingPermissoes(true);

      const payload = paginasSistema.map((pagina) => {
        const permissao = permissoesDraft[pagina.pagina_key] || { ...emptyPermissao };

        return {
          perfil_acesso_id: selectedPerfilId,
          pagina_key: pagina.pagina_key,
          pode_acessar: Boolean(permissao.pode_acessar),
          pode_criar: Boolean(permissao.pode_criar),
          pode_editar: Boolean(permissao.pode_editar),
          pode_excluir: Boolean(permissao.pode_excluir),
        };
      });

      const { error } = await supabase.from("perfil_acesso_permissoes").upsert(payload, {
        onConflict: "perfil_acesso_id,pagina_key",
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Permissões salvas com sucesso.");
      await loadAcessos();
    } catch (err) {
      console.error("Erro inesperado ao salvar permissões:", err);
      alert("Erro de conexão ao salvar permissões.");
    } finally {
      setSavingPermissoes(false);
    }
  };

  const segmentosComCategoria = useMemo(() => {
    return segmentos.map((segmento) => {
      const categoria = categorias.find((c) => c.categoria_id === segmento.categoria_id);

      return {
        ...segmento,
        categoriaNome: categoria?.nome || "-",
      };
    });
  }, [segmentos, categorias]);

  const areasComSegmento = useMemo(() => {
    return areasSpeaker.map((area) => {
      const segmento = segmentos.find((s) => s.segmento_id === area.segmento_id);

      return {
        ...area,
        segmentoNome: segmento?.nome || "-",
      };
    });
  }, [areasSpeaker, segmentos]);

  const selectedPerfil = perfisAcesso.find((perfil) => perfil.perfil_acesso_id === selectedPerfilId);

  return (
    <AppLayout>
      <div style={{ maxWidth: "900px" }}>
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
          <h3 style={sectionTitle}>🔐 Perfis de acesso</h3>
          <p style={cardDescription}>
            Configure quais páginas cada perfil pode acessar. O relacionamento da pessoa continua separado: Colaborador ou Terceirizado.
          </p>

          <div style={accessGrid}>
            <div style={profileColumn}>
              <div style={smallSectionTitle}>Perfis da empresa</div>

              {loadingAcessos ? (
                <div style={emptyText}>Carregando perfis...</div>
              ) : perfisAcesso.length === 0 ? (
                <div style={emptyText}>Nenhum perfil cadastrado.</div>
              ) : (
                <div style={profileList}>
                  {perfisAcesso.map((perfil) => (
                    <button
                      key={perfil.perfil_acesso_id}
                      type="button"
                      onClick={() => setSelectedPerfilId(perfil.perfil_acesso_id)}
                      style={
                        selectedPerfilId === perfil.perfil_acesso_id
                          ? profileButtonActive
                          : profileButton
                      }
                    >
                      <span style={profileName}>{getPerfilNomeVisual(perfil)}</span>
                      <span style={profileMeta}>
                        {perfil.sistema ? "Padrão" : "Personalizado"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div style={newProfileBox}>
                <div style={smallSectionTitle}>Criar novo perfil</div>

                <input
                  style={input}
                  placeholder="Ex: Financeiro"
                  value={novoPerfilNome}
                  onChange={(e) => setNovoPerfilNome(e.target.value)}
                />

                <textarea
                  style={{ ...textarea, marginTop: "8px" }}
                  placeholder="Descrição opcional"
                  value={novoPerfilDescricao}
                  onChange={(e) => setNovoPerfilDescricao(e.target.value)}
                />

                <button
                  type="button"
                  onClick={handleCreatePerfilAcesso}
                  disabled={savingNovoPerfil}
                  style={{ ...saveButton, marginTop: "8px", width: "100%" }}
                >
                  {savingNovoPerfil ? "Criando..." : "Criar perfil"}
                </button>
              </div>
            </div>

            <div style={permissionsColumn}>
              <div style={permissionsHeader}>
                <div>
                  <div style={smallSectionTitle}>Permissões</div>
                  <div style={selectedProfileName}>
                    {selectedPerfil ? getPerfilNomeVisual(selectedPerfil) : "Selecione um perfil"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSalvarPermissoes}
                  disabled={savingPermissoes || !selectedPerfilId}
                  style={saveButton}
                >
                  {savingPermissoes ? "Salvando..." : "Salvar permissões"}
                </button>
              </div>

              {loadingAcessos ? (
                <div style={emptyText}>Carregando permissões...</div>
              ) : !selectedPerfilId ? (
                <div style={emptyText}>Selecione um perfil para editar.</div>
              ) : (
                <div style={permissionTable}>
                  <div style={permissionHeaderRow}>
                    <div>Página</div>
                    <div style={permissionHeaderCell}>Acessar</div>
                    <div style={permissionHeaderCell}>Criar</div>
                    <div style={permissionHeaderCell}>Editar</div>
                    <div style={permissionHeaderCell}>Excluir</div>
                  </div>

                  {paginasSistema.map((pagina) => {
                    const permissao = permissoesDraft[pagina.pagina_key] || { ...emptyPermissao };

                    return (
                      <div key={pagina.pagina_key} style={permissionRow}>
                        <div>
                          <div style={permissionPageName}>{pagina.nome}</div>
                          <div style={permissionRoute}>{pagina.rota}</div>
                        </div>

                        <CheckCell
                          checked={permissao.pode_acessar}
                          onClick={() => handleTogglePermissao(pagina.pagina_key, "pode_acessar")}
                        />

                        <CheckCell
                          checked={permissao.pode_criar}
                          onClick={() => handleTogglePermissao(pagina.pagina_key, "pode_criar")}
                        />

                        <CheckCell
                          checked={permissao.pode_editar}
                          onClick={() => handleTogglePermissao(pagina.pagina_key, "pode_editar")}
                        />

                        <CheckCell
                          checked={permissao.pode_excluir}
                          onClick={() => handleTogglePermissao(pagina.pagina_key, "pode_excluir")}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
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

            <button onClick={handleCreateCategoria} disabled={savingCategoria} style={saveButton}>
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
                  <option key={categoria.categoria_id} value={categoria.categoria_id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <button onClick={handleCreateSegmento} disabled={savingSegmento} style={saveButton}>
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
                      <span style={{ color: "#6b7280" }}>— {segmento.categoriaNome}</span>
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
              <select style={input} value={segmentoAreaId} onChange={(e) => setSegmentoAreaId(e.target.value)}>
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
            <button onClick={handleCreateArea} disabled={savingArea} style={saveButton}>
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
                      <span style={{ color: "#6b7280" }}>— {area.segmentoNome}</span>
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
      </div>
    </AppLayout>
  );
}

function CheckCell({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={checked ? checkButtonActive : checkButton}>
      {checked ? "✓" : ""}
    </button>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
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

function getPerfilNomeVisual(perfil: PerfilAcesso) {
  if (perfil.slug === "admin") return "Administrador";
  if (perfil.slug === "operacional") return "Gestor";
  if (perfil.slug === "externo") return "Colaborador externo";
  return perfil.nome;
}

function getPerfilOrder(slug: string) {
  if (slug === "admin") return 1;
  if (slug === "operacional") return 2;
  if (slug === "externo") return 3;
  return 10;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
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
  marginBottom: "8px",
};

const cardDescription = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "0 0 14px",
  lineHeight: 1.5,
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

const textarea = {
  width: "100%",
  minHeight: "64px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "12px",
  boxSizing: "border-box" as const,
  resize: "vertical" as const,
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

const accessGrid = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gap: "14px",
  alignItems: "start",
};

const profileColumn = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "10px",
  background: "#fafafa",
};

const permissionsColumn = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "10px",
  background: "#ffffff",
};

const smallSectionTitle = {
  fontSize: "11px",
  color: "#374151",
  fontWeight: 700,
  marginBottom: "8px",
};

const profileList = {
  display: "grid",
  gap: "8px",
};

const profileButton = {
  width: "100%",
  border: "1px solid #e5e7eb",
  background: "white",
  borderRadius: "8px",
  padding: "10px",
  textAlign: "left" as const,
  cursor: "pointer",
};

const profileButtonActive = {
  ...profileButton,
  border: "1px solid #14b8a6",
  background: "#f0fdfa",
};

const profileName = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#111827",
};

const profileMeta = {
  display: "block",
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "2px",
};

const newProfileBox = {
  marginTop: "14px",
  paddingTop: "12px",
  borderTop: "1px solid #e5e7eb",
};

const permissionsHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
};

const selectedProfileName = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#111827",
};

const permissionTable = {
  display: "grid",
  gap: "6px",
};

const permissionHeaderRow = {
  display: "grid",
  gridTemplateColumns: "1fr 70px 70px 70px 70px",
  gap: "8px",
  alignItems: "center",
  fontSize: "10px",
  color: "#6b7280",
  fontWeight: 700,
  padding: "0 4px 4px",
};

const permissionHeaderCell = {
  textAlign: "center" as const,
};

const permissionRow = {
  display: "grid",
  gridTemplateColumns: "1fr 70px 70px 70px 70px",
  gap: "8px",
  alignItems: "center",
  border: "1px solid #f1f5f9",
  borderRadius: "8px",
  padding: "8px",
  background: "#fafafa",
};

const permissionPageName = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#111827",
};

const permissionRoute = {
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "2px",
};

const checkButton = {
  width: "26px",
  height: "26px",
  margin: "0 auto",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "white",
  color: "#0f766e",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 800,
};

const checkButtonActive = {
  ...checkButton,
  background: "#14b8a6",
  border: "1px solid #14b8a6",
  color: "white",
};
