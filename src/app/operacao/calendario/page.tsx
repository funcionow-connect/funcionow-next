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

type Tarefa = {
  tarefa_id: string;
  titulo: string;
};

type Reuniao = {
  reuniao_id: string;
  titulo: string;
};

type EventoCalendario = {
  evento_id: string;
  empresa_id: string;
  projeto_id: string | null;
  tarefa_id: string | null;
  reuniao_id: string | null;
  titulo: string;
  tipo:
    | "evento"
    | "call"
    | "reuniao"
    | "prazo"
    | "lancamento"
    | "live"
    | "postagem"
    | "follow_up"
    | "envio_produto"
    | "revisao"
    | "campanha";
  data_inicio: string;
  data_fim: string | null;
  descricao: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  projetos?: {
    nome: string;
  } | null;
  tarefas?: {
    titulo: string;
  } | null;
  reunioes?: {
    titulo: string;
  } | null;
};

const tipoOptions = [
  { value: "evento", label: "Evento" },
  { value: "call", label: "Call" },
  { value: "reuniao", label: "Reunião" },
  { value: "prazo", label: "Prazo" },
  { value: "lancamento", label: "Lançamento" },
  { value: "live", label: "Live" },
  { value: "postagem", label: "Postagem" },
  { value: "follow_up", label: "Follow-up" },
  { value: "envio_produto", label: "Envio de produto" },
  { value: "revisao", label: "Revisão" },
  { value: "campanha", label: "Campanha" },
] as const;

export default function CalendarioPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual | null>(null);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [projetoFiltro, setProjetoFiltro] = useState("todos");

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<EventoCalendario["tipo"]>("evento");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [tarefaId, setTarefaId] = useState("");
  const [reuniaoId, setReuniaoId] = useState("");

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const textoBusca = busca.trim().toLowerCase();

      const bateBusca =
        !textoBusca ||
        evento.titulo.toLowerCase().includes(textoBusca) ||
        evento.descricao?.toLowerCase().includes(textoBusca) ||
        evento.projetos?.nome?.toLowerCase().includes(textoBusca) ||
        evento.tarefas?.titulo?.toLowerCase().includes(textoBusca) ||
        evento.reunioes?.titulo?.toLowerCase().includes(textoBusca);

      const bateTipo = tipoFiltro === "todos" || evento.tipo === tipoFiltro;

      const bateProjeto =
        projetoFiltro === "todos" || evento.projeto_id === projetoFiltro;

      return bateBusca && bateTipo && bateProjeto;
    });
  }, [eventos, busca, tipoFiltro, projetoFiltro]);

  const eventosFuturos = eventosFiltrados.filter(
    (evento) => new Date(evento.data_inicio) >= new Date()
  );

  const eventosPassados = eventosFiltrados.filter(
    (evento) => new Date(evento.data_inicio) < new Date()
  );

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

      const [projetosResult, tarefasResult, reunioesResult, eventosResult] =
        await Promise.all([
          supabase
            .from("projetos")
            .select("projeto_id, nome")
            .eq("empresa_id", usuario.empresa_id)
            .order("nome", { ascending: true }),

          supabase
            .from("tarefas")
            .select("tarefa_id, titulo")
            .eq("empresa_id", usuario.empresa_id)
            .order("criado_em", { ascending: false })
            .limit(100),

          supabase
            .from("reunioes")
            .select("reuniao_id, titulo")
            .eq("empresa_id", usuario.empresa_id)
            .order("criado_em", { ascending: false })
            .limit(100),

          supabase
            .from("eventos_calendario")
            .select(
              `
              *,
              projetos (
                nome
              ),
              tarefas (
                titulo
              ),
              reunioes (
                titulo
              )
            `
            )
            .eq("empresa_id", usuario.empresa_id)
            .order("data_inicio", { ascending: true }),
        ]);

      if (projetosResult.error) {
        console.error("Erro ao carregar projetos:", projetosResult.error);
        alert("Não foi possível carregar os projetos.");
        return;
      }

      if (tarefasResult.error) {
        console.error("Erro ao carregar tarefas:", tarefasResult.error);
        alert("Não foi possível carregar as tarefas.");
        return;
      }

      if (reunioesResult.error) {
        console.error("Erro ao carregar reuniões:", reunioesResult.error);
        alert("Não foi possível carregar as reuniões.");
        return;
      }

      if (eventosResult.error) {
        console.error("Erro ao carregar eventos:", eventosResult.error);
        alert("Não foi possível carregar os eventos.");
        return;
      }

      setProjetos((projetosResult.data ?? []) as Projeto[]);
      setTarefas((tarefasResult.data ?? []) as Tarefa[]);
      setReunioes((reunioesResult.data ?? []) as Reuniao[]);
      setEventos((eventosResult.data ?? []) as EventoCalendario[]);
    } catch (error) {
      console.error("Erro inesperado ao carregar calendário:", error);
      alert("Erro inesperado ao carregar calendário.");
    } finally {
      setLoading(false);
    }
  };

  const criarEvento = async () => {
    if (!usuarioAtual) {
      alert("Usuário não carregado.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título do evento.");
      return;
    }

    if (!dataInicio) {
      alert("Informe a data e horário de início.");
      return;
    }

    if (titulo.trim().length > 120) {
      alert("O título deve ter no máximo 120 caracteres.");
      return;
    }

    if (titulo.includes("use client") || titulo.includes("import ")) {
      alert("O título parece conter código. Revise antes de salvar.");
      return;
    }

    try {
      setSalvando(true);

      const { error } = await supabase.from("eventos_calendario").insert({
        empresa_id: usuarioAtual.empresa_id,
        projeto_id: projetoId || null,
        tarefa_id: tarefaId || null,
        reuniao_id: reuniaoId || null,
        titulo: titulo.trim(),
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        descricao: descricao.trim() || null,
        criado_por: usuarioAtual.usuario_id,
      });

      if (error) {
        console.error("Erro ao criar evento:", error);
        alert("Não foi possível criar o evento.");
        return;
      }

      setTitulo("");
      setTipo("evento");
      setDataInicio("");
      setDataFim("");
      setDescricao("");
      setProjetoId("");
      setTarefaId("");
      setReuniaoId("");

      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao criar evento:", error);
      alert("Erro inesperado ao criar evento.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirEvento = async (eventoId: string) => {
    const confirmar = window.confirm("Deseja excluir este evento?");

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("eventos_calendario")
        .delete()
        .eq("evento_id", eventoId);

      if (error) {
        console.error("Erro ao excluir evento:", error);
        alert("Não foi possível excluir o evento.");
        return;
      }

      setEventos((lista) =>
        lista.filter((evento) => evento.evento_id !== eventoId)
      );
    } catch (error) {
      console.error("Erro inesperado ao excluir evento:", error);
      alert("Erro inesperado ao excluir evento.");
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Operação</p>

            <h1 style={titleStyle}>Calendário</h1>

            <p style={descriptionStyle}>
              Organize calls, prazos, lançamentos, postagens, campanhas,
              follow-ups e eventos importantes da operação.
            </p>
          </div>

          <div style={navStyle}>
            <a href="/operacao" style={linkStyle}>
              Dashboard Operacional
            </a>
            <a href="/operacao/tarefas" style={linkStyle}>
              Tarefas
            </a>
            <a href="/operacao/reunioes" style={linkStyle}>
              Reuniões
            </a>
          </div>
        </header>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Novo evento</h2>

          <div style={formGridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Título</label>
              <input
                value={titulo}
                onChange={(event) => setTitulo(event.target.value.slice(0, 120))}
                maxLength={120}
                placeholder="Ex: Follow-up com speaker Ana"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Tipo</label>
              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as EventoCalendario["tipo"])
                }
                style={inputStyle}
              >
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Início</label>
              <input
                type="datetime-local"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Fim</label>
              <input
                type="datetime-local"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
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

            <div style={fieldStyle}>
              <label style={labelStyle}>Tarefa vinculada</label>
              <select
                value={tarefaId}
                onChange={(event) => setTarefaId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Sem tarefa vinculada</option>
                {tarefas.map((tarefa) => (
                  <option key={tarefa.tarefa_id} value={tarefa.tarefa_id}>
                    {tarefa.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Reunião vinculada</label>
              <select
                value={reuniaoId}
                onChange={(event) => setReuniaoId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Sem reunião vinculada</option>
                {reunioes.map((reuniao) => (
                  <option key={reuniao.reuniao_id} value={reuniao.reuniao_id}>
                    {reuniao.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Descrição</label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={4}
                placeholder="Detalhes do evento, objetivo ou observações."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={fullWidthStyle}>
              <button
                onClick={criarEvento}
                disabled={salvando}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  background: "linear-gradient(to right, #0f766e, #14b8a6)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: salvando ? "not-allowed" : "pointer",
                  opacity: salvando ? 0.75 : 1,
                }}
              >
                {salvando ? "Salvando..." : "Criar evento"}
              </button>
            </div>
          </div>
        </section>

        <section style={{ marginTop: "24px" }}>
          <div style={metricsGridStyle}>
            <MetricCard label="Eventos futuros" value={eventosFuturos.length} />
            <MetricCard label="Eventos passados" value={eventosPassados.length} />
            <MetricCard label="Total filtrado" value={eventosFiltrados.length} />
            <MetricCard label="Projetos" value={projetos.length} />
          </div>

          <div style={filtersStyle}>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar evento..."
              style={{
                ...inputStyle,
                background: "white",
                minWidth: 0,
              }}
            />

            <select
              value={tipoFiltro}
              onChange={(event) => setTipoFiltro(event.target.value)}
              style={{
                ...inputStyle,
                background: "white",
                minWidth: 0,
              }}
            >
              <option value="todos">Todos os tipos</option>
              {tipoOptions.map((option) => (
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
                minWidth: 0,
              }}
            >
              <option value="todos">Todos os projetos</option>
              {projetos.map((projeto) => (
                <option key={projeto.projeto_id} value={projeto.projeto_id}>
                  {projeto.nome}
                </option>
              ))}
            </select>

            <div style={countStyle}>{eventosFiltrados.length} evento(s)</div>
          </div>

          {loading ? (
            <div style={emptyStateStyle}>Carregando eventos...</div>
          ) : eventosFiltrados.length === 0 ? (
            <div style={emptyStateStyle}>Nenhum evento encontrado.</div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {eventosFiltrados.map((evento) => (
                <article key={evento.evento_id} style={cardStyle}>
                  <div style={eventHeaderStyle}>
                    <div>
                      <h3 style={eventTitleStyle}>{evento.titulo}</h3>

                      <div style={badgeRowStyle}>
                        <Badge text={formatarTipo(evento.tipo)} />
                        <Badge
                          text={`Início: ${formatarDataHora(evento.data_inicio)}`}
                        />

                        {evento.data_fim && (
                          <Badge text={`Fim: ${formatarDataHora(evento.data_fim)}`} />
                        )}

                        {evento.projetos?.nome && (
                          <Badge text={`Projeto: ${evento.projetos.nome}`} />
                        )}

                        {evento.tarefas?.titulo && (
                          <Badge text={`Tarefa: ${evento.tarefas.titulo}`} />
                        )}

                        {evento.reunioes?.titulo && (
                          <Badge text={`Reunião: ${evento.reunioes.titulo}`} />
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => excluirEvento(evento.evento_id)}
                      style={deleteButtonStyle}
                    >
                      Excluir
                    </button>
                  </div>

                  {evento.descricao && (
                    <p style={eventDescriptionStyle}>{evento.descricao}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <strong style={metricValueStyle}>{value}</strong>
    </article>
  );
}

function Badge({ text }: { text: string }) {
  return <span style={badgeStyle}>{text}</span>;
}

function formatarTipo(tipo: EventoCalendario["tipo"]) {
  const item = tipoOptions.find((option) => option.value === tipo);
  return item?.label ?? tipo;
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px",
  color: "#111827",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "flex-start",
  marginBottom: "24px",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#0f766e",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 800,
  letterSpacing: "-0.03em",
};

const descriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6b7280",
  fontSize: "14px",
  maxWidth: "720px",
};

const linkStyle: React.CSSProperties = {
  color: "#0f766e",
  fontSize: "14px",
  textDecoration: "none",
  fontWeight: 800,
};

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  width: "100%",
  boxSizing: "border-box",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "18px",
  fontWeight: 800,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  width: "100%",
};

const fieldStyle: React.CSSProperties = {
  minWidth: 0,
};

const fullWidthStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  minWidth: 0,
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
  maxWidth: "100%",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const metricCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  minWidth: 0,
};

const metricLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 700,
};

const metricValueStyle: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  fontSize: "26px",
  color: "#111827",
};

const filtersStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 190px 220px auto",
  gap: "12px",
  marginBottom: "16px",
  alignItems: "center",
};

const countStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  whiteSpace: "nowrap",
};

const eventHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
};

const eventTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 800,
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "10px",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 800,
  padding: "5px 9px",
};

const deleteButtonStyle: React.CSSProperties = {
  border: "1px solid #fee2e2",
  borderRadius: "10px",
  background: "#fff",
  color: "#dc2626",
  padding: "8px 10px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};

const eventDescriptionStyle: React.CSSProperties = {
  margin: "14px 0 0",
  whiteSpace: "pre-wrap",
  color: "#475569",
  fontSize: "13px",
  lineHeight: 1.6,
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