"use client";

import Link from "next/link";
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
  projetos?: { nome: string } | null;
  tarefas?: { titulo: string } | null;
  reunioes?: { titulo: string } | null;
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
  const [periodoFiltro, setPeriodoFiltro] = useState("futuros");

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<EventoCalendario["tipo"]>("evento");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [tarefaId, setTarefaId] = useState("");
  const [reuniaoId, setReuniaoId] = useState("");

  const agora = new Date();

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);

  const eventosHoje = eventos.filter((evento) => {
    const data = new Date(evento.data_inicio);
    return data >= inicioHoje && data <= fimHoje;
  });

  const eventosFuturos = eventos.filter(
    (evento) => new Date(evento.data_inicio) >= agora,
  );

  const eventosPassados = eventos.filter(
    (evento) => new Date(evento.data_inicio) < agora,
  );

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const textoBusca = busca.trim().toLowerCase();
      const dataEvento = new Date(evento.data_inicio);

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

      const batePeriodo =
        periodoFiltro === "todos" ||
        (periodoFiltro === "hoje" && dataEvento >= inicioHoje && dataEvento <= fimHoje) ||
        (periodoFiltro === "futuros" && dataEvento >= agora) ||
        (periodoFiltro === "passados" && dataEvento < agora);

      return bateBusca && bateTipo && bateProjeto && batePeriodo;
    });
  }, [eventos, busca, tipoFiltro, projetoFiltro, periodoFiltro]);

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
              projetos (nome),
              tarefas (titulo),
              reunioes (titulo)
            `,
            )
            .eq("empresa_id", usuario.empresa_id)
            .order("data_inicio", { ascending: true }),
        ]);

      if (projetosResult.error) throw projetosResult.error;
      if (tarefasResult.error) throw tarefasResult.error;
      if (reunioesResult.error) throw reunioesResult.error;
      if (eventosResult.error) throw eventosResult.error;

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
    if (!usuarioAtual) return alert("Usuário não carregado.");
    if (!titulo.trim()) return alert("Informe o título do evento.");
    if (!dataInicio) return alert("Informe a data e horário de início.");
    if (titulo.trim().length > 120) return alert("O título deve ter no máximo 120 caracteres.");

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
    if (!window.confirm("Deseja excluir este evento?")) return;

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

      setEventos((lista) => lista.filter((evento) => evento.evento_id !== eventoId));
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
            <h1 style={titleStyle}>Calendário Operacional</h1>
            <p style={descriptionStyle}>
              Organize eventos, calls, prazos, campanhas, lançamentos e follow-ups da operação.
            </p>
          </div>

          <div style={navStyle}>
            <Link href="/operacao" style={linkStyle}>Dashboard</Link>
            <Link href="/operacao/tarefas" style={linkStyle}>Tarefas</Link>
            <Link href="/operacao/reunioes" style={linkStyle}>Reuniões</Link>
          </div>
        </header>

        <section style={metricsGridStyle}>
          <MetricCard label="Hoje" value={eventosHoje.length} description="Eventos do dia" />
          <MetricCard label="Futuros" value={eventosFuturos.length} description="Próximos eventos" />
          <MetricCard label="Passados" value={eventosPassados.length} description="Histórico" />
          <MetricCard label="Filtrados" value={eventosFiltrados.length} description="Resultado atual" />
        </section>

        <section style={cardStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Novo evento</h2>
              <p style={sectionDescriptionStyle}>
                Registre compromissos vinculados a projetos, tarefas ou reuniões.
              </p>
            </div>
          </div>

          <div style={formGridStyle}>
            <Field label="Título">
              <input
                value={titulo}
                onChange={(event) => setTitulo(event.target.value.slice(0, 120))}
                maxLength={120}
                placeholder="Ex: Follow-up com speaker Ana"
                style={inputStyle}
              />
            </Field>

            <Field label="Tipo">
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value as EventoCalendario["tipo"])}
                style={inputStyle}
              >
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Início">
              <input
                type="datetime-local"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Fim">
              <input
                type="datetime-local"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Projeto">
              <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} style={inputStyle}>
                <option value="">Sem projeto vinculado</option>
                {projetos.map((projeto) => (
                  <option key={projeto.projeto_id} value={projeto.projeto_id}>{projeto.nome}</option>
                ))}
              </select>
            </Field>

            <Field label="Tarefa vinculada">
              <select value={tarefaId} onChange={(e) => setTarefaId(e.target.value)} style={inputStyle}>
                <option value="">Sem tarefa vinculada</option>
                {tarefas.map((tarefa) => (
                  <option key={tarefa.tarefa_id} value={tarefa.tarefa_id}>{tarefa.titulo}</option>
                ))}
              </select>
            </Field>

            <Field label="Reunião vinculada">
              <select value={reuniaoId} onChange={(e) => setReuniaoId(e.target.value)} style={inputStyle}>
                <option value="">Sem reunião vinculada</option>
                {reunioes.map((reuniao) => (
                  <option key={reuniao.reuniao_id} value={reuniao.reuniao_id}>{reuniao.titulo}</option>
                ))}
              </select>
            </Field>

            <Field label="Descrição">
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={4}
                placeholder="Detalhes do evento, objetivo ou observações."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </Field>

            <div style={fullWidthStyle}>
              <button onClick={criarEvento} disabled={salvando} style={submitButtonStyle}>
                {salvando ? "Salvando..." : "Criar evento"}
              </button>
            </div>
          </div>
        </section>

        <section style={eventsSectionStyle}>
          <div style={filtersStyle}>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar evento..."
              style={{ ...inputStyle, background: "white" }}
            />

            <select value={periodoFiltro} onChange={(e) => setPeriodoFiltro(e.target.value)} style={inputStyle}>
              <option value="futuros">Futuros</option>
              <option value="hoje">Hoje</option>
              <option value="passados">Passados</option>
              <option value="todos">Todos</option>
            </select>

            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={inputStyle}>
              <option value="todos">Todos os tipos</option>
              {tipoOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select value={projetoFiltro} onChange={(e) => setProjetoFiltro(e.target.value)} style={inputStyle}>
              <option value="todos">Todos os projetos</option>
              {projetos.map((projeto) => (
                <option key={projeto.projeto_id} value={projeto.projeto_id}>{projeto.nome}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <EmptyState text="Carregando eventos..." />
          ) : eventosFiltrados.length === 0 ? (
            <EmptyState text="Nenhum evento encontrado." />
          ) : (
            <div style={eventsGridStyle}>
              {eventosFiltrados.map((evento) => (
                <article key={evento.evento_id} style={eventCardStyle}>
                  <div style={eventHeaderStyle}>
                    <div>
                      <div style={eventTypeLineStyle}>
                        <span style={typeDotStyle} />
                        {formatarTipo(evento.tipo)}
                      </div>

                      <h3 style={eventTitleStyle}>{evento.titulo}</h3>

                      <p style={dateTextStyle}>
                        {formatarDataHora(evento.data_inicio)}
                        {evento.data_fim ? ` até ${formatarDataHora(evento.data_fim)}` : ""}
                      </p>
                    </div>

                    <button type="button" onClick={() => excluirEvento(evento.evento_id)} style={deleteButtonStyle}>
                      Excluir
                    </button>
                  </div>

                  <div style={badgeRowStyle}>
                    {evento.projetos?.nome && <Badge text={`Projeto: ${evento.projetos.nome}`} />}
                    {evento.tarefas?.titulo && <Badge text={`Tarefa: ${evento.tarefas.titulo}`} />}
                    {evento.reunioes?.titulo && <Badge text={`Reunião: ${evento.reunioes.titulo}`} />}
                  </div>

                  {evento.descricao && <p style={eventDescriptionStyle}>{evento.descricao}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function MetricCard({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <strong style={metricValueStyle}>{value}</strong>
      <p style={metricDescriptionStyle}>{description}</p>
    </article>
  );
}

function Badge({ text }: { text: string }) {
  return <span style={badgeStyle}>{text}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div style={emptyStateStyle}>{text}</div>;
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
  fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 900,
  letterSpacing: "-0.04em",
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

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const metricCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
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
  fontSize: "30px",
  color: "#111827",
};

const metricDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: "13px",
  color: "#94a3b8",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const formHeaderStyle: React.CSSProperties = {
  marginBottom: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 900,
};

const sectionDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "13px",
  color: "#64748b",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const fieldStyle: React.CSSProperties = {
  minWidth: 0,
};

const fullWidthStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 800,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "12px",
  padding: "12px 14px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  color: "white",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
};

const eventsSectionStyle: React.CSSProperties = {
  marginTop: "24px",
};

const filtersStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 160px 190px 220px",
  gap: "12px",
  marginBottom: "16px",
};

const eventsGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
};

const eventCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const eventHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
};

const eventTypeLineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "12px",
  fontWeight: 900,
  color: "#0f766e",
  marginBottom: "8px",
};

const typeDotStyle: React.CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "#14b8a6",
};

const eventTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 900,
};

const dateTextStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
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
  borderRadius: "18px",
  padding: "32px",
  textAlign: "center",
  color: "#6b7280",
  fontSize: "14px",
};
