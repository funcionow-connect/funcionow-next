"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UsuarioAtual = {
  usuario_id: string;
  empresa_id: string;
  nome: string | null;
  email: string | null;
};

type Projeto = {
  projeto_id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  status: "ativo" | "pausado" | "concluido" | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  responsavel_id: string | null;
  criado_por: string | null;
  data_inicio: string | null;
  data_limite: string | null;
  criado_em: string;
  atualizado_em: string;
};

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
] as const;

const prioridadeOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export default function ProjetosPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<Projeto["status"]>("ativo");
  const [prioridade, setPrioridade] = useState<Projeto["prioridade"]>("media");
  const [dataInicio, setDataInicio] = useState("");
  const [dataLimite, setDataLimite] = useState("");

  const projetosFiltrados = useMemo(() => {
    return projetos.filter((projeto) => {
      const textoBusca = busca.trim().toLowerCase();

      const bateBusca =
        !textoBusca ||
        projeto.nome.toLowerCase().includes(textoBusca) ||
        projeto.descricao?.toLowerCase().includes(textoBusca);

      const bateStatus =
        statusFiltro === "todos" || projeto.status === statusFiltro;

      return bateBusca && bateStatus;
    });
  }, [projetos, busca, statusFiltro]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        console.error("Erro ao buscar usuário autenticado:", authError);
        window.location.href = "/login";
        return;
      }

      const authUserId = authData.user?.id;

      if (!authUserId) {
        window.location.href = "/login";
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("usuario_id, empresa_id, nome, email")
        .eq("usuario_id", authUserId)
        .maybeSingle<UsuarioAtual>();

      if (usuarioError) {
        console.error("Erro ao buscar usuário:", usuarioError);
        alert("Não foi possível carregar os dados do usuário.");
        return;
      }

      if (!usuario?.empresa_id) {
        window.location.href = "/perfil";
        return;
      }

      setUsuarioAtual(usuario);

      const { data: projetosData, error: projetosError } = await supabase
        .from("projetos")
        .select("*")
        .eq("empresa_id", usuario.empresa_id)
        .order("criado_em", { ascending: false });

      if (projetosError) {
        console.error("Erro ao carregar projetos:", projetosError);
        alert("Não foi possível carregar os projetos.");
        return;
      }

      setProjetos((projetosData ?? []) as Projeto[]);
    } catch (error) {
      console.error("Erro inesperado ao carregar projetos:", error);
      alert("Erro inesperado ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  };

  const criarProjeto = async () => {
    if (!usuarioAtual) {
      alert("Usuário não carregado.");
      return;
    }

    if (!nome.trim()) {
      alert("Informe o nome do projeto.");
      return;
    }

    try {
      setSalvando(true);

      const { error } = await supabase.from("projetos").insert({
        empresa_id: usuarioAtual.empresa_id,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        status,
        prioridade,
        data_inicio: dataInicio || null,
        data_limite: dataLimite || null,
        responsavel_id: usuarioAtual.usuario_id,
        criado_por: usuarioAtual.usuario_id,
      });

      if (error) {
        console.error("Erro ao criar projeto:", error);
        alert("Não foi possível criar o projeto.");
        return;
      }

      setNome("");
      setDescricao("");
      setStatus("ativo");
      setPrioridade("media");
      setDataInicio("");
      setDataLimite("");

      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao criar projeto:", error);
      alert("Erro inesperado ao criar projeto.");
    } finally {
      setSalvando(false);
    }
  };

  const atualizarStatusProjeto = async (
    projetoId: string,
    novoStatus: Projeto["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("projetos")
        .update({ status: novoStatus })
        .eq("projeto_id", projetoId);

      if (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Não foi possível atualizar o status.");
        return;
      }

      setProjetos((lista) =>
        lista.map((projeto) =>
          projeto.projeto_id === projetoId
            ? { ...projeto, status: novoStatus }
            : projeto
        )
      );
    } catch (error) {
      console.error("Erro inesperado ao atualizar status:", error);
      alert("Erro inesperado ao atualizar status.");
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "24px",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "13px",
                color: "#0f766e",
                fontWeight: 600,
              }}
            >
              Operação
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              Projetos
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "14px",
                maxWidth: "640px",
              }}
            >
              Organize as principais frentes da empresa: lançamentos,
              campanhas, estruturação comercial, creators, reuniões e execução
              operacional.
            </p>
          </div>

          <a
            href="/dashboard"
            style={{
              color: "#0f766e",
              fontSize: "14px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Voltar ao dashboard
          </a>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "360px 1fr",
            gap: "24px",
            alignItems: "flex-start",
          }}
        >
          <aside
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              Novo projeto
            </h2>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Nome do projeto</label>
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex: Lançamento produto saúde e beleza"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descreva o objetivo, contexto e resultado esperado."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as Projeto["status"])
                    }
                    style={inputStyle}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Prioridade</label>
                  <select
                    value={prioridade}
                    onChange={(event) =>
                      setPrioridade(
                        event.target.value as Projeto["prioridade"]
                      )
                    }
                    style={inputStyle}
                  >
                    {prioridadeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(event) => setDataInicio(event.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Prazo</label>
                  <input
                    type="date"
                    value={dataLimite}
                    onChange={(event) => setDataLimite(event.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                onClick={criarProjeto}
                disabled={salvando}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  padding: "11px 14px",
                  background: "linear-gradient(to right, #0f766e, #14b8a6)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: salvando ? "not-allowed" : "pointer",
                  opacity: salvando ? 0.75 : 1,
                }}
              >
                {salvando ? "Salvando..." : "Criar projeto"}
              </button>
            </div>
          </aside>

          <section>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                alignItems: "center",
              }}
            >
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar projeto..."
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "320px",
                }}
              />

              <select
                value={statusFiltro}
                onChange={(event) => setStatusFiltro(event.target.value)}
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "180px",
                }}
              >
                <option value="todos">Todos os status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div
                style={{
                  marginLeft: "auto",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                {projetosFiltrados.length} projeto(s)
              </div>
            </div>

            {loading ? (
              <div style={emptyStateStyle}>Carregando projetos...</div>
            ) : projetosFiltrados.length === 0 ? (
              <div style={emptyStateStyle}>
                Nenhum projeto encontrado. Crie o primeiro projeto da operação.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {projetosFiltrados.map((projeto) => (
                  <article
                    key={projeto.projeto_id}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "18px",
                      boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "17px",
                            fontWeight: 700,
                          }}
                        >
                          {projeto.nome}
                        </h3>

                        {projeto.descricao && (
                          <p
                            style={{
                              margin: "8px 0 0",
                              fontSize: "14px",
                              color: "#6b7280",
                              lineHeight: 1.5,
                            }}
                          >
                            {projeto.descricao}
                          </p>
                        )}
                      </div>

                      <select
                        value={projeto.status}
                        onChange={(event) =>
                          atualizarStatusProjeto(
                            projeto.projeto_id,
                            event.target.value as Projeto["status"]
                          )
                        }
                        style={{
                          ...inputStyle,
                          width: "150px",
                          background: "#f9fafb",
                        }}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginTop: "14px",
                      }}
                    >
                      <Badge label={`Prioridade: ${formatarPrioridade(projeto.prioridade)}`} />
                      <Badge label={`Status: ${formatarStatus(projeto.status)}`} />
                      {projeto.data_inicio && (
                        <Badge label={`Início: ${formatarData(projeto.data_inicio)}`} />
                      )}
                      {projeto.data_limite && (
                        <Badge label={`Prazo: ${formatarData(projeto.data_limite)}`} />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: "12px",
        fontWeight: 600,
        padding: "6px 10px",
      }}
    >
      {label}
    </span>
  );
}

function formatarStatus(status: Projeto["status"]) {
  const item = statusOptions.find((option) => option.value === status);
  return item?.label ?? status;
}

function formatarPrioridade(prioridade: Projeto["prioridade"]) {
  const item = prioridadeOptions.find((option) => option.value === prioridade);
  return item?.label ?? prioridade;
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};
 
const emptyStateStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "32px",
  textAlign: "center",
  color: "#6b7280",
  fontSize: "14px",
};