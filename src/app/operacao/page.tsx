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
  status: "ativo" | "pausado" | "concluido" | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  data_limite: string | null;
  criado_em: string;
};

type Tarefa = {
  tarefa_id: string;
  titulo: string;
  status:
    | "a_fazer"
    | "em_andamento"
    | "aguardando_terceiro"
    | "em_revisao"
    | "concluido"
    | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  data_limite: string | null;
  criado_em: string;
};

type Reuniao = {
  reuniao_id: string;
  titulo: string;
  tipo: string;
  data_inicio: string | null;
  criado_em: string;
};

type Nota = {
  nota_id: string;
  titulo: string;
  tipo: string;
  criado_em: string;
};

type EventoCalendario = {
  evento_id: string;
  titulo: string;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  criado_em: string;
};

type MembroEquipe = {
  membro_id: string;
  nome: string;
  tipo_membro: string | null;
  cargo: string | null;
  status: string | null;
};

export default function OperacaoDashboardPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [membros, setMembros] = useState<MembroEquipe[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }, []);

  const projetosAtivos = projetos.filter((projeto) => projeto.status === "ativo");

  const tarefasAbertas = tarefas.filter(
    (tarefa) => tarefa.status !== "concluido" && tarefa.status !== "cancelado",
  );

  const tarefasConcluidas = tarefas.filter(
    (tarefa) => tarefa.status === "concluido",
  );

  const tarefasUrgentes = tarefasAbertas.filter(
    (tarefa) => tarefa.prioridade === "urgente" || tarefa.prioridade === "alta",
  );

  const tarefasAtrasadas = tarefasAbertas.filter((tarefa) => {
    if (!tarefa.data_limite) return false;

    const prazo = new Date(tarefa.data_limite);
    prazo.setHours(0, 0, 0, 0);

    return prazo < hoje;
  });

  const proximasReunioes = reunioes
    .filter((reuniao) => {
      if (!reuniao.data_inicio) return false;
      return new Date(reuniao.data_inicio) >= new Date();
    })
    .slice(0, 5);

  const proximosEventos = eventos
    .filter((evento) => new Date(evento.data_inicio) >= new Date())
    .slice(0, 5);

  const membrosAtivos = membros.filter((membro) => membro.status === "ativo");

  const carregarDashboard = async () => {
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

      const empresaId = usuario.empresa_id;

      const [
        projetosResult,
        tarefasResult,
        reunioesResult,
        notasResult,
        eventosResult,
        membrosResult,
      ] = await Promise.all([
        supabase
          .from("projetos")
          .select("projeto_id, nome, status, prioridade, data_limite, criado_em")
          .eq("empresa_id", empresaId)
          .order("criado_em", { ascending: false })
          .limit(8),

        supabase
          .from("tarefas")
          .select("tarefa_id, titulo, status, prioridade, data_limite, criado_em")
          .eq("empresa_id", empresaId)
          .order("criado_em", { ascending: false })
          .limit(40),

        supabase
          .from("reunioes")
          .select("reuniao_id, titulo, tipo, data_inicio, criado_em")
          .eq("empresa_id", empresaId)
          .order("data_inicio", { ascending: true })
          .limit(20),

        supabase
          .from("notas")
          .select("nota_id, titulo, tipo, criado_em")
          .eq("empresa_id", empresaId)
          .order("criado_em", { ascending: false })
          .limit(6),

        supabase
          .from("eventos_calendario")
          .select("evento_id, titulo, tipo, data_inicio, data_fim, criado_em")
          .eq("empresa_id", empresaId)
          .order("data_inicio", { ascending: true })
          .limit(20),

        supabase
          .from("membros_equipe")
          .select("membro_id, nome, tipo_membro, cargo, status")
          .eq("empresa_id", empresaId)
          .order("nome", { ascending: true }),
      ]);

      if (projetosResult.error) console.error("Erro ao carregar projetos:", projetosResult.error);
      if (tarefasResult.error) console.error("Erro ao carregar tarefas:", tarefasResult.error);
      if (reunioesResult.error) console.error("Erro ao carregar reuniões:", reunioesResult.error);
      if (notasResult.error) console.error("Erro ao carregar notas:", notasResult.error);
      if (eventosResult.error) console.error("Erro ao carregar eventos:", eventosResult.error);
      if (membrosResult.error) console.error("Erro ao carregar membros:", membrosResult.error);

      setProjetos((projetosResult.data ?? []) as Projeto[]);
      setTarefas((tarefasResult.data ?? []) as Tarefa[]);
      setReunioes((reunioesResult.data ?? []) as Reuniao[]);
      setNotas((notasResult.data ?? []) as Nota[]);
      setEventos((eventosResult.data ?? []) as EventoCalendario[]);
      setMembros((membrosResult.data ?? []) as MembroEquipe[]);
    } catch (error) {
      console.error("Erro inesperado ao carregar dashboard:", error);
      alert("Erro inesperado ao carregar o dashboard operacional.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Funcionow Connect</p>

            <h1 style={titleStyle}>Dashboard Operacional</h1>

            <p style={descriptionStyle}>
              Painel central da operação: projetos, tarefas, prazos, reuniões,
              calendário, notas e equipe.
            </p>

            {usuarioAtual?.nome && (
              <p style={userTextStyle}>Logado como {usuarioAtual.nome}</p>
            )}
          </div>

          <div style={headerActionsStyle}>
            <Link href="/operacao/tarefas" style={primaryButtonStyle}>
              Ver tarefas
            </Link>
            <Link href="/operacao/reunioes" style={secondaryButtonStyle}>
              Nova reunião
            </Link>
          </div>
        </header>

        <section style={metricsGridStyle}>
          <MetricCard
            label="Projetos ativos"
            value={projetosAtivos.length}
            description="Frentes em andamento"
          />
          <MetricCard
            label="Tarefas abertas"
            value={tarefasAbertas.length}
            description="Pendências não concluídas"
          />
          <MetricCard
            label="Tarefas atrasadas"
            value={tarefasAtrasadas.length}
            description="Prazos vencidos"
            danger={tarefasAtrasadas.length > 0}
          />
          <MetricCard
            label="Tarefas urgentes"
            value={tarefasUrgentes.length}
            description="Alta prioridade"
            danger={tarefasUrgentes.length > 0}
          />
          <MetricCard
            label="Reuniões futuras"
            value={proximasReunioes.length}
            description="Calls e alinhamentos"
          />
          <MetricCard
            label="Eventos futuros"
            value={proximosEventos.length}
            description="Calendário operacional"
          />
          <MetricCard
            label="Membros ativos"
            value={membrosAtivos.length}
            description="Equipe e terceiros"
          />
          <MetricCard
            label="Tarefas concluídas"
            value={tarefasConcluidas.length}
            description="Execuções finalizadas"
          />
        </section>

        <section style={mainGridStyle}>
          <div style={leftColumnStyle}>
            <Panel
              title="Tarefas prioritárias"
              actionLabel="Ver tarefas"
              actionHref="/operacao/tarefas"
            >
              {loading ? (
                <EmptyText text="Carregando tarefas..." />
              ) : tarefasUrgentes.length === 0 ? (
                <EmptyText text="Nenhuma tarefa urgente no momento." />
              ) : (
                <div style={listStyle}>
                  {tarefasUrgentes.slice(0, 6).map((tarefa) => (
                    <ItemCard key={tarefa.tarefa_id}>
                      <strong style={itemTitleStyle}>{tarefa.titulo}</strong>
                      <div style={badgeRowStyle}>
                        <Badge text={formatarStatusTarefa(tarefa.status)} />
                        <Badge text={formatarPrioridade(tarefa.prioridade)} />
                        {tarefa.data_limite && (
                          <Badge text={`Prazo: ${formatarData(tarefa.data_limite)}`} />
                        )}
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Projetos recentes"
              actionLabel="Ver projetos"
              actionHref="/operacao/projetos"
            >
              {loading ? (
                <EmptyText text="Carregando projetos..." />
              ) : projetos.length === 0 ? (
                <EmptyText text="Nenhum projeto cadastrado ainda." />
              ) : (
                <div style={listStyle}>
                  {projetos.slice(0, 6).map((projeto) => (
                    <ItemCard key={projeto.projeto_id}>
                      <strong style={itemTitleStyle}>{projeto.nome}</strong>
                      <div style={badgeRowStyle}>
                        <Badge text={formatarStatusProjeto(projeto.status)} />
                        <Badge text={formatarPrioridade(projeto.prioridade)} />
                        {projeto.data_limite && (
                          <Badge text={`Prazo: ${formatarData(projeto.data_limite)}`} />
                        )}
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div style={rightColumnStyle}>
            <Panel title="Atalhos rápidos" actionLabel="" actionHref="">
              <div style={quickGridStyle}>
                <QuickLink href="/operacao/projetos" label="Projetos" />
                <QuickLink href="/operacao/tarefas" label="Tarefas" />
                <QuickLink href="/operacao/reunioes" label="Reuniões" />
                <QuickLink href="/operacao/calendario" label="Calendário" />
                <QuickLink href="/operacao/notas" label="Notas" />
              </div>
            </Panel>

            <Panel
              title="Próximas reuniões"
              actionLabel="Ver reuniões"
              actionHref="/operacao/reunioes"
            >
              {loading ? (
                <EmptyText text="Carregando reuniões..." />
              ) : proximasReunioes.length === 0 ? (
                <EmptyText text="Nenhuma reunião futura cadastrada." />
              ) : (
                <div style={listStyle}>
                  {proximasReunioes.map((reuniao) => (
                    <ItemCard key={reuniao.reuniao_id}>
                      <strong style={itemTitleStyle}>{reuniao.titulo}</strong>
                      <p style={itemMetaStyle}>
                        {reuniao.data_inicio
                          ? formatarDataHora(reuniao.data_inicio)
                          : "Sem data definida"}
                      </p>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Próximos eventos"
              actionLabel="Ver calendário"
              actionHref="/operacao/calendario"
            >
              {loading ? (
                <EmptyText text="Carregando eventos..." />
              ) : proximosEventos.length === 0 ? (
                <EmptyText text="Nenhum evento futuro cadastrado." />
              ) : (
                <div style={listStyle}>
                  {proximosEventos.map((evento) => (
                    <ItemCard key={evento.evento_id}>
                      <strong style={itemTitleStyle}>{evento.titulo}</strong>
                      <p style={itemMetaStyle}>{formatarDataHora(evento.data_inicio)}</p>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Notas recentes"
              actionLabel="Ver notas"
              actionHref="/operacao/notas"
            >
              {loading ? (
                <EmptyText text="Carregando notas..." />
              ) : notas.length === 0 ? (
                <EmptyText text="Nenhuma nota cadastrada ainda." />
              ) : (
                <div style={listStyle}>
                  {notas.map((nota) => (
                    <ItemCard key={nota.nota_id}>
                      <strong style={itemTitleStyle}>{nota.titulo}</strong>
                      <p style={itemMetaStyle}>Tipo: {formatarTipoNota(nota.tipo)}</p>
                    </ItemCard>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  danger = false,
}: {
  label: string;
  value: number;
  description: string;
  danger?: boolean;
}) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <strong style={{ ...metricValueStyle, color: danger ? "#dc2626" : "#111827" }}>
        {value}
      </strong>
      <p style={metricDescriptionStyle}>{description}</p>
    </article>
  );
}

function Panel({
  title,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  actionLabel: string;
  actionHref: string;
  children: React.ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <h2 style={panelTitleStyle}>{title}</h2>

        {actionLabel && actionHref && (
          <Link href={actionHref} style={panelLinkStyle}>
            {actionLabel}
          </Link>
        )}
      </div>

      {children}
    </section>
  );
}

function ItemCard({ children }: { children: React.ReactNode }) {
  return <div style={itemStyle}>{children}</div>;
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={quickLinkStyle}>
      {label}
    </Link>
  );
}

function Badge({ text }: { text: string }) {
  return <span style={badgeStyle}>{text}</span>;
}

function EmptyText({ text }: { text: string }) {
  return <div style={emptyTextStyle}>{text}</div>;
}

function formatarStatusProjeto(status: Projeto["status"]) {
  const mapa = {
    ativo: "Ativo",
    pausado: "Pausado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return mapa[status] ?? status;
}

function formatarStatusTarefa(status: Tarefa["status"]) {
  const mapa = {
    a_fazer: "A fazer",
    em_andamento: "Em andamento",
    aguardando_terceiro: "Aguardando terceiro",
    em_revisao: "Em revisão",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return mapa[status] ?? status;
}

function formatarPrioridade(prioridade: Projeto["prioridade"] | Tarefa["prioridade"]) {
  const mapa = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  return mapa[prioridade] ?? prioridade;
}

function formatarTipoNota(tipo: string) {
  const mapa: Record<string, string> = {
    nota: "Nota",
    processo: "Processo",
    ata: "Ata",
    ideia: "Ideia",
    script: "Script",
    produto: "Produto",
    estrategia: "Estratégia",
    outro: "Outro",
  };

  return mapa[tipo] ?? tipo;
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
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
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "flex-start",
  marginBottom: "24px",
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

const userTextStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "10px 14px",
  background: "#0f172a",
  color: "#fff",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 800,
};

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "10px 14px",
  background: "#ecfeff",
  color: "#0f766e",
  border: "1px solid #99f6e4",
  textDecoration: "none",
  fontSize: "13px",
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
  lineHeight: 1,
};

const metricDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: "13px",
  color: "#94a3b8",
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr",
  gap: "24px",
  alignItems: "flex-start",
};

const leftColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: "24px",
};

const rightColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: "24px",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  marginBottom: "14px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 900,
};

const panelLinkStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#0f766e",
  fontWeight: 800,
  textDecoration: "none",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const itemStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "12px",
  background: "#ffffff",
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: "14px",
};

const itemMetaStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "13px",
  color: "#64748b",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginTop: "8px",
  flexWrap: "wrap",
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

const quickGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const quickLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#0f172a",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 800,
};

const emptyTextStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#64748b",
  fontSize: "14px",
  textAlign: "center",
};
