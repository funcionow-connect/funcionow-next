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
  nome: string;
};

type MembroEquipe = {
  membro_id: string;
  nome: string;
  cargo: string | null;
  tipo_membro: string | null;
  status: string | null;
};

type Tarefa = {
  tarefa_id: string;
  empresa_id: string;
  projeto_id: string | null;
  titulo: string;
  descricao: string | null;
  status:
    | "a_fazer"
    | "em_andamento"
    | "aguardando_terceiro"
    | "em_revisao"
    | "concluido"
    | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
 responsavel_id: string | null;
responsavel_membro_id: string | null;
criado_por: string | null;
membros_equipe?: {
  nome: string;
  cargo: string | null;
  tipo_membro: string | null;
} | null;

  data_limite: string | null;
  concluido_em: string | null;
  criado_em: string;
  atualizado_em: string;
  projetos?: {
    nome: string;
  } | null;
};

const statusOptions = [
  { value: "a_fazer", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando_terceiro", label: "Aguardando terceiro" },
  { value: "em_revisao", label: "Em revisão" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
] as const;

const prioridadeOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export default function TarefasPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
const [projetos, setProjetos] = useState<Projeto[]>([]);
const [membrosEquipe, setMembrosEquipe] = useState<MembroEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [projetoFiltro, setProjetoFiltro] = useState("todos");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [responsavelMembroId, setResponsavelMembroId] = useState("");
  const [status, setStatus] = useState<Tarefa["status"]>("a_fazer");
  const [prioridade, setPrioridade] = useState<Tarefa["prioridade"]>("media");
  const [dataLimite, setDataLimite] = useState("");

  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter((tarefa) => {
      const textoBusca = busca.trim().toLowerCase();

      const bateBusca =
        !textoBusca ||
        tarefa.titulo.toLowerCase().includes(textoBusca) ||
        tarefa.descricao?.toLowerCase().includes(textoBusca) ||
        tarefa.projetos?.nome?.toLowerCase().includes(textoBusca);

      const bateStatus =
        statusFiltro === "todos" || tarefa.status === statusFiltro;

      const bateProjeto =
        projetoFiltro === "todos" || tarefa.projeto_id === projetoFiltro;

      return bateBusca && bateStatus && bateProjeto;
    });
  }, [tarefas, busca, statusFiltro, projetoFiltro]);

  const tarefasPorStatus = useMemo(() => {
    return statusOptions.map((statusItem) => ({
      ...statusItem,
      tarefas: tarefasFiltradas.filter(
        (tarefa) => tarefa.status === statusItem.value
      ),
    }));
  }, [tarefasFiltradas]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();

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

      const [projetosResult, membrosResult, tarefasResult] = await Promise.all([
  supabase
    .from("projetos")
    .select("projeto_id, nome")
    .eq("empresa_id", usuario.empresa_id)
    .order("nome", { ascending: true }),

  supabase
    .from("membros_equipe")
    .select("membro_id, nome, cargo, tipo_membro, status")
    .eq("empresa_id", usuario.empresa_id)
    .eq("status", "ativo")
    .order("nome", { ascending: true }),

  supabase
    .from("tarefas")
    .select(
      `
      *,
      projetos (
        nome
      ),
      membros_equipe (
        nome,
        cargo,
        tipo_membro
      )
    `
    )
    .eq("empresa_id", usuario.empresa_id)
    .order("criado_em", { ascending: false }),
]);

      if (projetosResult.error) {
        console.error("Erro ao carregar projetos:", projetosResult.error);
        alert("Não foi possível carregar os projetos.");
        return;
      }

      if (membrosResult.error) {
  console.error("Erro ao carregar membros da equipe:", membrosResult.error);
  alert("Não foi possível carregar os responsáveis.");
  return;
}

      if (tarefasResult.error) {
        console.error("Erro ao carregar tarefas:", tarefasResult.error);
        alert("Não foi possível carregar as tarefas.");
        return;
      }

      setProjetos((projetosResult.data ?? []) as Projeto[]);
setMembrosEquipe((membrosResult.data ?? []) as MembroEquipe[]);
setTarefas((tarefasResult.data ?? []) as Tarefa[]);
    } catch (error) {
      console.error("Erro inesperado ao carregar tarefas:", error);
      alert("Erro inesperado ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  };

  const criarTarefa = async () => {
    if (!usuarioAtual) {
      alert("Usuário não carregado.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título da tarefa.");
      return;
    }

if (titulo.trim().length > 120) {
  alert("O título da tarefa deve ter no máximo 120 caracteres.");
  return;
}

if (titulo.includes("use client") || titulo.includes("import ")) {
  alert("O título parece conter código. Revise antes de salvar.");
  return;
}

    try {
      setSalvando(true);

      const { error } = await supabase.from("tarefas").insert({
  empresa_id: usuarioAtual.empresa_id,
  projeto_id: projetoId || null,
  titulo: titulo.trim(),
  descricao: descricao.trim() || null,
  status,
  prioridade,
  data_limite: dataLimite || null,
  responsavel_id: usuarioAtual.usuario_id,
  responsavel_membro_id: responsavelMembroId || null,
  criado_por: usuarioAtual.usuario_id,
});

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        alert("Não foi possível criar a tarefa.");
        return;
      }

      setTitulo("");
      setDescricao("");
      setProjetoId("");
      setResponsavelMembroId("");
      setStatus("a_fazer");
      setPrioridade("media");
      setDataLimite("");

      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao criar tarefa:", error);
      alert("Erro inesperado ao criar tarefa.");
    } finally {
      setSalvando(false);
    }
  };

  const atualizarStatusTarefa = async (
    tarefaId: string,
    novoStatus: Tarefa["status"]
  ) => {
    try {
      const payload =
        novoStatus === "concluido"
          ? { status: novoStatus, concluido_em: new Date().toISOString() }
          : { status: novoStatus, concluido_em: null };

      const { error } = await supabase
        .from("tarefas")
        .update(payload)
        .eq("tarefa_id", tarefaId);

      if (error) {
        console.error("Erro ao atualizar status da tarefa:", error);
        alert("Não foi possível atualizar o status da tarefa.");
        return;
      }

      setTarefas((lista) =>
        lista.map((tarefa) =>
          tarefa.tarefa_id === tarefaId
            ? {
                ...tarefa,
                status: novoStatus,
                concluido_em:
                  novoStatus === "concluido"
                    ? new Date().toISOString()
                    : null,
              }
            : tarefa
        )
      );
    } catch (error) {
      console.error("Erro inesperado ao atualizar tarefa:", error);
      alert("Erro inesperado ao atualizar tarefa.");
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
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
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
                fontWeight: 700,
              }}
            >
              Operação
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Tarefas
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "14px",
                maxWidth: "680px",
              }}
            >
              Acompanhe pendências, responsáveis, prazos e execução dos projetos
              da empresa.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <a href="/operacao" style={linkStyle}>
              Dashboard Operacional
            </a>
            <a href="/operacao/projetos" style={linkStyle}>
              Projetos
            </a>
          </div>
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
                fontWeight: 800,
              }}
            >
              Nova tarefa
            </h2>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Título</label>
                <input
  value={titulo}
  onChange={(event) => setTitulo(event.target.value.slice(0, 120))}
  maxLength={120}
  placeholder="Ex: Montar lista de speakers de corrida"
  style={inputStyle}
/>
              </div>

              <div>
                <label style={labelStyle}>Projeto</label>
                <select
                  value={projetoId}
                  onChange={(event) => setProjetoId(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">Sem projeto vinculado</option>
                  {projetos.map((projeto) => (
                    <option key={projeto.projeto_id} value={projeto.projeto_id}>
                      {projeto.nome}
                    </option>
                  ))}
                </select>
              </div>

<div>
  <label style={labelStyle}>Responsável</label>
  <select
    value={responsavelMembroId}
    onChange={(event) => setResponsavelMembroId(event.target.value)}
    style={inputStyle}
  >
    <option value="">Sem responsável definido</option>
    {membrosEquipe.map((membro) => (
      <option key={membro.membro_id} value={membro.membro_id}>
        {membro.nome}
        {membro.cargo ? ` — ${membro.cargo}` : ""}
        {membro.tipo_membro ? ` (${membro.tipo_membro})` : ""}
      </option>
    ))}
  </select>
</div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descreva a tarefa, contexto e resultado esperado."
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
                      setStatus(event.target.value as Tarefa["status"])
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
                      setPrioridade(event.target.value as Tarefa["prioridade"])
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

              <div>
                <label style={labelStyle}>Prazo</label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(event) => setDataLimite(event.target.value)}
                  style={inputStyle}
                />
              </div>

              <button
                onClick={criarTarefa}
                disabled={salvando}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  padding: "11px 14px",
                  background: "linear-gradient(to right, #0f766e, #14b8a6)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: salvando ? "not-allowed" : "pointer",
                  opacity: salvando ? 0.75 : 1,
                }}
              >
                {salvando ? "Salvando..." : "Criar tarefa"}
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
                placeholder="Buscar tarefa..."
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "280px",
                }}
              />

              <select
                value={statusFiltro}
                onChange={(event) => setStatusFiltro(event.target.value)}
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "190px",
                }}
              >
                <option value="todos">Todos os status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={projetoFiltro}
                onChange={(event) => setProjetoFiltro(event.target.value)}
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "220px",
                }}
              >
                <option value="todos">Todos os projetos</option>
                {projetos.map((projeto) => (
                  <option key={projeto.projeto_id} value={projeto.projeto_id}>
                    {projeto.nome}
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
                {tarefasFiltradas.length} tarefa(s)
              </div>
            </div>

            {loading ? (
              <div style={emptyStateStyle}>Carregando tarefas...</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
              >
                {tarefasPorStatus.map((coluna) => (
                  <div
                    key={coluna.value}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "12px",
                      minHeight: "220px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        {coluna.label}
                      </h3>

                      <span
                        style={{
                          borderRadius: "999px",
                          background: "white",
                          color: "#64748b",
                          fontSize: "12px",
                          fontWeight: 800,
                          padding: "4px 8px",
                        }}
                      >
                        {coluna.tarefas.length}
                      </span>
                    </div>

                    {coluna.tarefas.length === 0 ? (
                      <div
                        style={{
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.7)",
                          padding: "16px",
                          color: "#94a3b8",
                          fontSize: "13px",
                          textAlign: "center",
                        }}
                      >
                        Nenhuma tarefa
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {coluna.tarefas.map((tarefa) => (
                          <article
                            key={tarefa.tarefa_id}
                            style={{
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "14px",
                              padding: "14px",
                              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "10px",
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  fontWeight: 800,
                                  lineHeight: 1.4,
                                }}
                              >
                                {tarefa.titulo}
                              </h4>

                              <select
                                value={tarefa.status}
                                onChange={(event) =>
                                  atualizarStatusTarefa(
                                    tarefa.tarefa_id,
                                    event.target.value as Tarefa["status"]
                                  )
                                }
                                style={{
                                  borderRadius: "8px",
                                  border: "1px solid #d1d5db",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  background: "#f9fafb",
                                  height: "32px",
                                  maxWidth: "128px",
                                }}
                              >
                                {statusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {tarefa.descricao && (
                              <p
                                style={{
                                  margin: "8px 0 0",
                                  color: "#64748b",
                                  fontSize: "13px",
                                  lineHeight: 1.5,
                                }}
                              >
                                {tarefa.descricao}
                              </p>
                            )}

                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                                marginTop: "12px",
                              }}
                            >
                              <Badge
                                text={`Prioridade: ${formatarPrioridade(
                                  tarefa.prioridade
                                )}`}
                              />

                              {tarefa.projetos?.nome && (
                                <Badge text={`Projeto: ${tarefa.projetos.nome}`} />
                              )}

                              {tarefa.membros_equipe?.nome && (
  <Badge text={`Responsável: ${tarefa.membros_equipe.nome}`} />
)}

                              {tarefa.data_limite && (
                                <Badge
                                  text={`Prazo: ${formatarData(tarefa.data_limite)}`}
                                  danger={estaAtrasada(tarefa)}
                                />
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Badge({ text, danger = false }: { text: string; danger?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        background: danger ? "#fee2e2" : "#f1f5f9",
        color: danger ? "#b91c1c" : "#475569",
        fontSize: "11px",
        fontWeight: 800,
        padding: "5px 8px",
      }}
    >
      {text}
    </span>
  );
}

function formatarPrioridade(prioridade: Tarefa["prioridade"]) {
  const mapa = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  return mapa[prioridade] ?? prioridade;
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function estaAtrasada(tarefa: Tarefa) {
  if (!tarefa.data_limite) return false;
  if (tarefa.status === "concluido" || tarefa.status === "cancelado") return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const prazo = new Date(tarefa.data_limite);
  prazo.setHours(0, 0, 0, 0);

  return prazo < hoje;
}

const linkStyle: React.CSSProperties = {
  color: "#0f766e",
  fontSize: "14px",
  textDecoration: "none",
  fontWeight: 800,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 700,
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