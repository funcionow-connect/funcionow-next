"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useEffect, useMemo, useState } from "react";
>>>>>>> bba70e9 (feat: add operational MVP module)
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
<<<<<<< HEAD
  status: string;
  prioridade: string;
=======
  status: "ativo" | "pausado" | "concluido" | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
>>>>>>> bba70e9 (feat: add operational MVP module)
  data_limite: string | null;
  criado_em: string;
};

type Tarefa = {
  tarefa_id: string;
  titulo: string;
<<<<<<< HEAD
  status: string;
  prioridade: string;
=======
  status:
    | "a_fazer"
    | "em_andamento"
    | "aguardando_terceiro"
    | "em_revisao"
    | "concluido"
    | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
>>>>>>> bba70e9 (feat: add operational MVP module)
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

export default function OperacaoDashboardPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  const projetosAtivos = projetos.filter((projeto) => projeto.status === "ativo");
  const tarefasAbertas = tarefas.filter(
    (tarefa) => tarefa.status !== "concluido" && tarefa.status !== "cancelado"
  );
  const tarefasAtrasadas = tarefasAbertas.filter((tarefa) => {
    if (!tarefa.data_limite) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(tarefa.data_limite);
    prazo.setHours(0, 0, 0, 0);
    return prazo < hoje;
  });
  const proximasReunioes = reunioes
    .filter((reuniao) => reuniao.data_inicio && new Date(reuniao.data_inicio) >= new Date())
=======
  const hoje = useMemo(() => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }, []);

  const projetosAtivos = projetos.filter((projeto) => projeto.status === "ativo");

  const tarefasAbertas = tarefas.filter(
    (tarefa) => tarefa.status !== "concluido" && tarefa.status !== "cancelado"
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
>>>>>>> bba70e9 (feat: add operational MVP module)
    .slice(0, 5);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
<<<<<<< HEAD
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user?.id) {
=======

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Erro ao buscar usuário autenticado:", authError);
        window.location.href = "/login";
        return;
      }

      const authUserId = authData.user?.id;

      if (!authUserId) {
>>>>>>> bba70e9 (feat: add operational MVP module)
        window.location.href = "/login";
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("usuario_id, empresa_id, nome, email")
<<<<<<< HEAD
        .eq("usuario_id", authData.user.id)
=======
        .eq("usuario_id", authUserId)
>>>>>>> bba70e9 (feat: add operational MVP module)
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

<<<<<<< HEAD
      const [projetosResult, tarefasResult, reunioesResult, notasResult] = await Promise.all([
        supabase
          .from("projetos")
          .select("projeto_id, nome, status, prioridade, data_limite, criado_em")
          .eq("empresa_id", usuario.empresa_id)
          .order("criado_em", { ascending: false })
          .limit(6),
        supabase
          .from("tarefas")
          .select("tarefa_id, titulo, status, prioridade, data_limite, criado_em")
          .eq("empresa_id", usuario.empresa_id)
          .order("criado_em", { ascending: false })
          .limit(20),
        supabase
          .from("reunioes")
          .select("reuniao_id, titulo, tipo, data_inicio, criado_em")
          .eq("empresa_id", usuario.empresa_id)
          .order("data_inicio", { ascending: true })
          .limit(10),
        supabase
          .from("notas")
          .select("nota_id, titulo, tipo, criado_em")
          .eq("empresa_id", usuario.empresa_id)
=======
      const empresaId = usuario.empresa_id;

      const [
        projetosResult,
        tarefasResult,
        reunioesResult,
        notasResult,
      ] = await Promise.all([
        supabase
          .from("projetos")
          .select("projeto_id, nome, status, prioridade, data_limite, criado_em")
          .eq("empresa_id", empresaId)
          .order("criado_em", { ascending: false })
          .limit(6),

        supabase
          .from("tarefas")
          .select("tarefa_id, titulo, status, prioridade, data_limite, criado_em")
          .eq("empresa_id", empresaId)
          .order("criado_em", { ascending: false })
          .limit(20),

        supabase
          .from("reunioes")
          .select("reuniao_id, titulo, tipo, data_inicio, criado_em")
          .eq("empresa_id", empresaId)
          .order("data_inicio", { ascending: true })
          .limit(10),

        supabase
          .from("notas")
          .select("nota_id, titulo, tipo, criado_em")
          .eq("empresa_id", empresaId)
>>>>>>> bba70e9 (feat: add operational MVP module)
          .order("criado_em", { ascending: false })
          .limit(5),
      ]);

<<<<<<< HEAD
=======
      if (projetosResult.error) {
        console.error("Erro ao carregar projetos:", projetosResult.error);
      }

      if (tarefasResult.error) {
        console.error("Erro ao carregar tarefas:", tarefasResult.error);
      }

      if (reunioesResult.error) {
        console.error("Erro ao carregar reuniões:", reunioesResult.error);
      }

      if (notasResult.error) {
        console.error("Erro ao carregar notas:", notasResult.error);
      }

>>>>>>> bba70e9 (feat: add operational MVP module)
      setProjetos((projetosResult.data ?? []) as Projeto[]);
      setTarefas((tarefasResult.data ?? []) as Tarefa[]);
      setReunioes((reunioesResult.data ?? []) as Reuniao[]);
      setNotas((notasResult.data ?? []) as Nota[]);
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
<<<<<<< HEAD
    <main style={pageStyle}>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Funcionow Connect</p>
            <h1 style={titleStyle}>Dashboard Operacional</h1>
            <p style={descriptionStyle}>
              Visão central da operação: projetos, tarefas, reuniões, prazos e registros importantes da empresa.
            </p>
            {usuarioAtual?.nome && <p style={smallMutedStyle}>Logado como {usuarioAtual.nome}</p>}
          </div>
          <a href="/dashboard" style={linkStyle}>Voltar ao dashboard</a>
        </header>

        <section style={metricsGridStyle}>
          <MetricCard label="Projetos ativos" value={projetosAtivos.length} description="Frentes em andamento" />
          <MetricCard label="Tarefas abertas" value={tarefasAbertas.length} description="Pendências não concluídas" />
          <MetricCard label="Tarefas atrasadas" value={tarefasAtrasadas.length} description="Prazos vencidos" danger={tarefasAtrasadas.length > 0} />
          <MetricCard label="Próximas reuniões" value={proximasReunioes.length} description="Calls e alinhamentos" />
        </section>

        <section style={contentGridStyle}>
          <div style={{ display: "grid", gap: "24px" }}>
            <Panel title="Projetos recentes" actionLabel="Ver projetos" actionHref="/operacao/projetos">
              {loading ? <EmptyText text="Carregando projetos..." /> : projetos.length === 0 ? <EmptyText text="Nenhum projeto cadastrado ainda." /> : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {projetos.map((projeto) => (
                    <div key={projeto.projeto_id} style={itemStyle}>
                      <strong style={{ fontSize: "14px" }}>{projeto.nome}</strong>
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                        <Badge text={formatarStatusProjeto(projeto.status)} />
                        <Badge text={formatarPrioridade(projeto.prioridade)} />
                        {projeto.data_limite && <Badge text={`Prazo: ${formatarData(projeto.data_limite)}`} />}
=======
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
                fontWeight: 700,
              }}
            >
              Funcionow Connect
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Dashboard Operacional
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "14px",
                maxWidth: "680px",
              }}
            >
              Visão central da operação: projetos, tarefas, reuniões, prazos e
              registros importantes da empresa.
            </p>

            {usuarioAtual?.nome && (
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "13px" }}>
                Logado como {usuarioAtual.nome}
              </p>
            )}
          </div>

          <a
            href="/dashboard"
            style={{
              color: "#0f766e",
              fontSize: "14px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Voltar ao dashboard
          </a>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
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
            label="Próximas reuniões"
            value={proximasReunioes.length}
            description="Calls e alinhamentos"
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "24px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "grid", gap: "24px" }}>
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
                <div style={{ display: "grid", gap: "10px" }}>
                  {projetos.map((projeto) => (
                    <div key={projeto.projeto_id} style={itemStyle}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{projeto.nome}</strong>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <Badge text={formatarStatusProjeto(projeto.status)} />
                          <Badge text={formatarPrioridade(projeto.prioridade)} />
                          {projeto.data_limite && (
                            <Badge text={`Prazo: ${formatarData(projeto.data_limite)}`} />
                          )}
                        </div>
>>>>>>> bba70e9 (feat: add operational MVP module)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

<<<<<<< HEAD
            <Panel title="Tarefas abertas" actionLabel="Ver tarefas" actionHref="/operacao/tarefas">
              {loading ? <EmptyText text="Carregando tarefas..." /> : tarefasAbertas.length === 0 ? <EmptyText text="Nenhuma tarefa aberta ainda." /> : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {tarefasAbertas.slice(0, 6).map((tarefa) => (
                    <div key={tarefa.tarefa_id} style={itemStyle}>
                      <strong style={{ fontSize: "14px" }}>{tarefa.titulo}</strong>
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                        <Badge text={formatarStatusTarefa(tarefa.status)} />
                        <Badge text={formatarPrioridade(tarefa.prioridade)} />
                        {tarefa.data_limite && <Badge text={`Prazo: ${formatarData(tarefa.data_limite)}`} />}
=======
            <Panel
              title="Tarefas abertas"
              actionLabel="Ver tarefas"
              actionHref="/operacao/tarefas"
            >
              {loading ? (
                <EmptyText text="Carregando tarefas..." />
              ) : tarefasAbertas.length === 0 ? (
                <EmptyText text="Nenhuma tarefa aberta ainda." />
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {tarefasAbertas.slice(0, 6).map((tarefa) => (
                    <div key={tarefa.tarefa_id} style={itemStyle}>
                      <div>
                        <strong style={{ fontSize: "14px" }}>{tarefa.titulo}</strong>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <Badge text={formatarStatusTarefa(tarefa.status)} />
                          <Badge text={formatarPrioridade(tarefa.prioridade)} />
                          {tarefa.data_limite && (
                            <Badge text={`Prazo: ${formatarData(tarefa.data_limite)}`} />
                          )}
                        </div>
>>>>>>> bba70e9 (feat: add operational MVP module)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div style={{ display: "grid", gap: "24px" }}>
<<<<<<< HEAD
            <Panel title="Atalhos rápidos" actionLabel="" actionHref="">
=======
            <Panel
              title="Atalhos rápidos"
              actionLabel=""
              actionHref=""
            >
>>>>>>> bba70e9 (feat: add operational MVP module)
              <div style={{ display: "grid", gap: "10px" }}>
                <QuickLink href="/operacao/projetos" label="Criar ou revisar projetos" />
                <QuickLink href="/operacao/tarefas" label="Acompanhar tarefas" />
                <QuickLink href="/operacao/reunioes" label="Registrar reunião/call" />
                <QuickLink href="/operacao/calendario" label="Ver calendário" />
                <QuickLink href="/operacao/notas" label="Abrir notas" />
              </div>
            </Panel>

<<<<<<< HEAD
            <Panel title="Próximas reuniões" actionLabel="Ver reuniões" actionHref="/operacao/reunioes">
              {loading ? <EmptyText text="Carregando reuniões..." /> : proximasReunioes.length === 0 ? <EmptyText text="Nenhuma reunião futura cadastrada." /> : (
=======
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
>>>>>>> bba70e9 (feat: add operational MVP module)
                <div style={{ display: "grid", gap: "10px" }}>
                  {proximasReunioes.map((reuniao) => (
                    <div key={reuniao.reuniao_id} style={itemStyle}>
                      <strong style={{ fontSize: "14px" }}>{reuniao.titulo}</strong>
<<<<<<< HEAD
                      <p style={smallMutedStyle}>{reuniao.data_inicio ? formatarDataHora(reuniao.data_inicio) : "Sem data definida"}</p>
=======
                      <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                        {reuniao.data_inicio
                          ? formatarDataHora(reuniao.data_inicio)
                          : "Sem data definida"}
                      </p>
>>>>>>> bba70e9 (feat: add operational MVP module)
                    </div>
                  ))}
                </div>
              )}
            </Panel>

<<<<<<< HEAD
            <Panel title="Notas recentes" actionLabel="Ver notas" actionHref="/operacao/notas">
              {loading ? <EmptyText text="Carregando notas..." /> : notas.length === 0 ? <EmptyText text="Nenhuma nota cadastrada ainda." /> : (
=======
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
>>>>>>> bba70e9 (feat: add operational MVP module)
                <div style={{ display: "grid", gap: "10px" }}>
                  {notas.map((nota) => (
                    <div key={nota.nota_id} style={itemStyle}>
                      <strong style={{ fontSize: "14px" }}>{nota.titulo}</strong>
<<<<<<< HEAD
                      <p style={smallMutedStyle}>Tipo: {nota.tipo}</p>
=======
                      <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                        Tipo: {nota.tipo}
                      </p>
>>>>>>> bba70e9 (feat: add operational MVP module)
                    </div>
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

<<<<<<< HEAD
function MetricCard({ label, value, description, danger = false }: { label: string; value: number; description: string; danger?: boolean }) {
  return (
    <article style={cardStyle}>
      <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 600 }}>{label}</p>
      <strong style={{ display: "block", marginTop: "8px", fontSize: "30px", lineHeight: 1, color: danger ? "#dc2626" : "#111827" }}>{value}</strong>
      <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#94a3b8" }}>{description}</p>
=======
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
    <article
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
        {label}
      </p>
      <strong
        style={{
          display: "block",
          marginTop: "8px",
          fontSize: "30px",
          lineHeight: 1,
          color: danger ? "#dc2626" : "#111827",
        }}
      >
        {value}
      </strong>
      <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#94a3b8" }}>
        {description}
      </p>
>>>>>>> bba70e9 (feat: add operational MVP module)
    </article>
  );
}

<<<<<<< HEAD
function Panel({ title, actionLabel, actionHref, children }: { title: string; actionLabel: string; actionHref: string; children: React.ReactNode }) {
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>{title}</h2>
        {actionLabel && actionHref && <a href={actionHref} style={linkStyle}>{actionLabel}</a>}
      </div>
=======
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
    <section
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
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>{title}</h2>

        {actionLabel && actionHref && (
          <a
            href={actionHref}
            style={{
              fontSize: "13px",
              color: "#0f766e",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {actionLabel}
          </a>
        )}
      </div>

>>>>>>> bba70e9 (feat: add operational MVP module)
      {children}
    </section>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
<<<<<<< HEAD
  return <a href={href} style={quickLinkStyle}>{label}</a>;
}

function Badge({ text }: { text: string }) {
  return <span style={badgeStyle}>{text}</span>;
}

function EmptyText({ text }: { text: string }) {
  return <div style={emptyStateStyle}>{text}</div>;
}

function formatarStatusProjeto(status: string) {
  const mapa: Record<string, string> = { ativo: "Ativo", pausado: "Pausado", concluido: "Concluído", cancelado: "Cancelado" };
  return mapa[status] ?? status;
}

function formatarStatusTarefa(status: string) {
  const mapa: Record<string, string> = { a_fazer: "A fazer", em_andamento: "Em andamento", aguardando_terceiro: "Aguardando terceiro", em_revisao: "Em revisão", concluido: "Concluído", cancelado: "Cancelado" };
  return mapa[status] ?? status;
}

function formatarPrioridade(prioridade: string) {
  const mapa: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
=======
  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        color: "#0f172a",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 700,
      }}
    >
      {label}
    </a>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: "12px",
        fontWeight: 700,
        padding: "5px 9px",
      }}
    >
      {text}
    </span>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "12px",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: "14px",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
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

>>>>>>> bba70e9 (feat: add operational MVP module)
  return mapa[prioridade] ?? prioridade;
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatarDataHora(data: string) {
<<<<<<< HEAD
  return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f8fafc", padding: "32px", color: "#111827" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "flex-start", marginBottom: "24px" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: "13px", color: "#0f766e", fontWeight: 700 };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em" };
const descriptionStyle: React.CSSProperties = { margin: "8px 0 0", color: "#6b7280", fontSize: "14px", maxWidth: "680px" };
const smallMutedStyle: React.CSSProperties = { margin: "8px 0 0", color: "#64748b", fontSize: "13px" };
const linkStyle: React.CSSProperties = { color: "#0f766e", fontSize: "13px", textDecoration: "none", fontWeight: 700 };
const metricsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" };
const contentGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "flex-start" };
const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "18px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" };
const itemStyle: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", background: "#ffffff" };
const badgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", borderRadius: "999px", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: 700, padding: "5px 9px" };
const quickLinkStyle: React.CSSProperties = { display: "block", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", textDecoration: "none", fontSize: "14px", fontWeight: 700 };
const emptyStateStyle: React.CSSProperties = { padding: "18px", borderRadius: "12px", background: "#f8fafc", color: "#64748b", fontSize: "14px", textAlign: "center" };
=======
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const itemStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "12px",
  background: "#ffffff",
};
>>>>>>> bba70e9 (feat: add operational MVP module)
