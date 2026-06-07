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

type Reuniao = {
  reuniao_id: string;
  empresa_id: string;
  projeto_id: string | null;
  titulo: string;
  tipo: "call" | "reuniao_interna" | "reuniao_cliente" | "alinhamento" | "outro";
  data_inicio: string | null;
  data_fim: string | null;
  pauta: string | null;
  resumo: string | null;
  decisoes: string | null;
  proximos_passos: string | null;
  link_reuniao: string | null;
  transcricao: string | null;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  projetos?: {
    nome: string;
  } | null;
};

type TarefaGerada = {
  id: string;
  titulo: string;
  descricao: string;
  responsavel_membro_id: string;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  data_limite: string;
  criar: boolean;
};

const tipoOptions = [
  { value: "call", label: "Call" },
  { value: "reuniao_interna", label: "Reunião interna" },
  { value: "reuniao_cliente", label: "Reunião com cliente" },
  { value: "alinhamento", label: "Alinhamento" },
  { value: "outro", label: "Outro" },
] as const;

const prioridadeOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export default function ReunioesPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [membrosEquipe, setMembrosEquipe] = useState<MembroEquipe[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [projetoFiltro, setProjetoFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const [titulo, setTitulo] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [tipo, setTipo] = useState<Reuniao["tipo"]>("call");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [linkReuniao, setLinkReuniao] = useState("");
  const [pauta, setPauta] = useState("");
  const [resumo, setResumo] = useState("");
  const [decisoes, setDecisoes] = useState("");
  const [proximosPassos, setProximosPassos] = useState("");
  const [transcricao, setTranscricao] = useState("");

  const [reuniaoSelecionada, setReuniaoSelecionada] =
    useState<Reuniao | null>(null);
  const [tarefasGeradas, setTarefasGeradas] = useState<TarefaGerada[]>([]);
  const [salvandoTarefas, setSalvandoTarefas] = useState(false);

  const reunioesFiltradas = useMemo(() => {
    return reunioes.filter((reuniao) => {
      const textoBusca = busca.trim().toLowerCase();

      const bateBusca =
        !textoBusca ||
        reuniao.titulo.toLowerCase().includes(textoBusca) ||
        reuniao.pauta?.toLowerCase().includes(textoBusca) ||
        reuniao.resumo?.toLowerCase().includes(textoBusca) ||
        reuniao.decisoes?.toLowerCase().includes(textoBusca) ||
        reuniao.proximos_passos?.toLowerCase().includes(textoBusca) ||
        reuniao.projetos?.nome?.toLowerCase().includes(textoBusca);

      const bateProjeto =
        projetoFiltro === "todos" || reuniao.projeto_id === projetoFiltro;

      const bateTipo = tipoFiltro === "todos" || reuniao.tipo === tipoFiltro;

      return bateBusca && bateProjeto && bateTipo;
    });
  }, [reunioes, busca, projetoFiltro, tipoFiltro]);

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

      const [projetosResult, membrosResult, reunioesResult] = await Promise.all([
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
          .from("reunioes")
          .select(
            `
            *,
            projetos (
              nome
            )
          `
          )
          .eq("empresa_id", usuario.empresa_id)
          .order("data_inicio", { ascending: false, nullsFirst: false })
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

      if (reunioesResult.error) {
        console.error("Erro ao carregar reuniões:", reunioesResult.error);
        alert("Não foi possível carregar as reuniões.");
        return;
      }

      setProjetos((projetosResult.data ?? []) as Projeto[]);
      setMembrosEquipe((membrosResult.data ?? []) as MembroEquipe[]);
      setReunioes((reunioesResult.data ?? []) as Reuniao[]);
    } catch (error) {
      console.error("Erro inesperado ao carregar reuniões:", error);
      alert("Erro inesperado ao carregar reuniões.");
    } finally {
      setLoading(false);
    }
  };

  const criarReuniao = async () => {
    if (!usuarioAtual) {
      alert("Usuário não carregado.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título da reunião.");
      return;
    }

    if (titulo.trim().length > 120) {
      alert("O título da reunião deve ter no máximo 120 caracteres.");
      return;
    }

    if (titulo.includes("use client") || titulo.includes("import ")) {
      alert("O título parece conter código. Revise antes de salvar.");
      return;
    }

    try {
      setSalvando(true);

      const { error } = await supabase.from("reunioes").insert({
        empresa_id: usuarioAtual.empresa_id,
        projeto_id: projetoId || null,
        titulo: titulo.trim(),
        tipo,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        pauta: pauta.trim() || null,
        resumo: resumo.trim() || null,
        decisoes: decisoes.trim() || null,
        proximos_passos: proximosPassos.trim() || null,
        link_reuniao: linkReuniao.trim() || null,
        transcricao: transcricao.trim() || null,
        criado_por: usuarioAtual.usuario_id,
      });

      if (error) {
        console.error("Erro ao criar reunião:", error);
        alert("Não foi possível criar a reunião.");
        return;
      }

      setTitulo("");
      setProjetoId("");
      setTipo("call");
      setDataInicio("");
      setDataFim("");
      setLinkReuniao("");
      setPauta("");
      setResumo("");
      setDecisoes("");
      setProximosPassos("");
      setTranscricao("");

      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao criar reunião:", error);
      alert("Erro inesperado ao criar reunião.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirRevisaoTarefas = (reuniao: Reuniao) => {
    const textoBase =
      reuniao.proximos_passos ||
      reuniao.decisoes ||
      reuniao.resumo ||
      "";

    if (!textoBase.trim()) {
      alert(
        "Esta reunião não possui próximos passos, decisões ou resumo para gerar tarefas."
      );
      return;
    }

    const itens = textoBase
      .split(/\r?\n/)
      .map((item) =>
        item
          .replace(/^[-•*]\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .trim()
      )
      .filter((item) => item.length > 0);

    if (itens.length === 0) {
      alert("Não encontrei itens válidos para gerar tarefas.");
      return;
    }

    const novasTarefas: TarefaGerada[] = itens.map((item, index) => ({
      id: `${reuniao.reuniao_id}-${index}`,
      titulo: item.slice(0, 120),
      descricao: `Tarefa criada a partir da reunião: ${reuniao.titulo}`,
      responsavel_membro_id: "",
      prioridade: "media",
      data_limite: "",
      criar: true,
    }));

    setReuniaoSelecionada(reuniao);
    setTarefasGeradas(novasTarefas);

    setTimeout(() => {
      document
        .getElementById("painel-revisao-tarefas")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const atualizarTarefaGerada = (
    id: string,
    campo: keyof TarefaGerada,
    valor: string | boolean
  ) => {
    setTarefasGeradas((lista) =>
      lista.map((tarefa) =>
        tarefa.id === id
          ? ({ ...tarefa, [campo]: valor } as TarefaGerada)
          : tarefa
      )
    );
  };

  const cancelarRevisaoTarefas = () => {
    setReuniaoSelecionada(null);
    setTarefasGeradas([]);
  };

  const salvarTarefasGeradas = async () => {
    if (!usuarioAtual) {
      alert("Usuário não carregado.");
      return;
    }

    if (!reuniaoSelecionada) {
      alert("Nenhuma reunião selecionada.");
      return;
    }

    const tarefasParaCriar = tarefasGeradas.filter((tarefa) => tarefa.criar);

    if (tarefasParaCriar.length === 0) {
      alert("Selecione pelo menos uma tarefa para criar.");
      return;
    }

    const tarefaSemTitulo = tarefasParaCriar.find(
      (tarefa) => !tarefa.titulo.trim()
    );

    if (tarefaSemTitulo) {
      alert("Todas as tarefas selecionadas precisam ter título.");
      return;
    }

    try {
      setSalvandoTarefas(true);

      const payload = tarefasParaCriar.map((tarefa) => ({
        empresa_id: usuarioAtual.empresa_id,
        projeto_id: reuniaoSelecionada.projeto_id || null,
        titulo: tarefa.titulo.trim().slice(0, 120),
        descricao: tarefa.descricao.trim() || null,
        status: "a_fazer",
        prioridade: tarefa.prioridade,
        data_limite: tarefa.data_limite || null,
        responsavel_id: usuarioAtual.usuario_id,
        responsavel_membro_id: tarefa.responsavel_membro_id || null,
        criado_por: usuarioAtual.usuario_id,
      }));

      const { error } = await supabase.from("tarefas").insert(payload);

      if (error) {
        console.error("Erro ao criar tarefas:", error);
        alert("Não foi possível criar as tarefas.");
        return;
      }

      alert(`${payload.length} tarefa(s) criada(s) com sucesso.`);
      cancelarRevisaoTarefas();
      window.location.href = "/operacao/tarefas";
    } catch (error) {
      console.error("Erro inesperado ao criar tarefas:", error);
      alert("Erro inesperado ao criar tarefas.");
    } finally {
      setSalvandoTarefas(false);
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
            <p style={eyebrowStyle}>Operação</p>

            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Reuniões / Calls
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "14px",
                maxWidth: "720px",
              }}
            >
              Registre calls, pautas, resumos, decisões e próximos passos da
              operação. Depois vamos transformar decisões em tarefas.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <a href="/operacao" style={linkStyle}>
              Dashboard Operacional
            </a>
            <a href="/operacao/tarefas" style={linkStyle}>
              Tarefas
            </a>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
            alignItems: "flex-start",
          }}
        >
          <aside
            style={{
              ...cardStyle,
              maxWidth: "100%",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              Nova reunião
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <div>
                <label style={labelStyle}>Título</label>
                <input
                  value={titulo}
                  onChange={(event) =>
                    setTitulo(event.target.value.slice(0, 120))
                  }
                  maxLength={120}
                  placeholder="Ex: Call de alinhamento inicial Burble Fresh"
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
                <label style={labelStyle}>Tipo</label>
                <select
                  value={tipo}
                  onChange={(event) =>
                    setTipo(event.target.value as Reuniao["tipo"])
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
                    type="datetime-local"
                    value={dataInicio}
                    onChange={(event) => setDataInicio(event.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Fim</label>
                  <input
                    type="datetime-local"
                    value={dataFim}
                    onChange={(event) => setDataFim(event.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Link da reunião</label>
                <input
                  value={linkReuniao}
                  onChange={(event) => setLinkReuniao(event.target.value)}
                  placeholder="https://meet.google.com/..."
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Pauta</label>
                <textarea
                  value={pauta}
                  onChange={(event) => setPauta(event.target.value)}
                  rows={3}
                  placeholder="Quais assuntos precisam ser tratados?"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Resumo</label>
                <textarea
                  value={resumo}
                  onChange={(event) => setResumo(event.target.value)}
                  rows={3}
                  placeholder="Resumo do que foi conversado."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Decisões</label>
                <textarea
                  value={decisoes}
                  onChange={(event) => setDecisoes(event.target.value)}
                  rows={3}
                  placeholder="Decisões tomadas na call."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Próximos passos</label>
                <textarea
                  value={proximosPassos}
                  onChange={(event) => setProximosPassos(event.target.value)}
                  rows={3}
                  placeholder="Uma tarefa por linha. Ex: Criar lista de 30 speakers de corrida"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Transcrição</label>
                <textarea
                  value={transcricao}
                  onChange={(event) => setTranscricao(event.target.value)}
                  rows={4}
                  placeholder="Cole aqui a transcrição da reunião, se tiver."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  onClick={criarReuniao}
                  disabled={salvando}
                  style={{
                    width: "100%",
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
                  {salvando ? "Salvando..." : "Registrar reunião"}
                </button>
              </div>
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
                placeholder="Buscar reunião..."
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "280px",
                }}
              />

              <select
                value={tipoFiltro}
                onChange={(event) => setTipoFiltro(event.target.value)}
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "190px",
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
                {reunioesFiltradas.length} reunião(ões)
              </div>
            </div>

            {loading ? (
              <div style={emptyStateStyle}>Carregando reuniões...</div>
            ) : reunioesFiltradas.length === 0 ? (
              <div style={emptyStateStyle}>
                Nenhuma reunião registrada ainda.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {reunioesFiltradas.map((reuniao) => (
                  <article key={reuniao.reuniao_id} style={cardStyle}>
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
                            fontWeight: 800,
                          }}
                        >
                          {reuniao.titulo}
                        </h3>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <Badge text={formatarTipo(reuniao.tipo)} />

                          {reuniao.projetos?.nome && (
                            <Badge text={`Projeto: ${reuniao.projetos.nome}`} />
                          )}

                          {reuniao.data_inicio && (
                            <Badge text={formatarDataHora(reuniao.data_inicio)} />
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => abrirRevisaoTarefas(reuniao)}
                          style={{
                            border: "1px solid #0f766e",
                            borderRadius: "10px",
                            background: "white",
                            color: "#0f766e",
                            padding: "8px 10px",
                            fontSize: "13px",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Gerar tarefas
                        </button>

                        {reuniao.link_reuniao && (
                          <a
                            href={reuniao.link_reuniao}
                            target="_blank"
                            rel="noreferrer"
                            style={linkStyle}
                          >
                            Abrir link
                          </a>
                        )}
                      </div>
                    </div>

                    {reuniao.pauta && (
                      <TextBlock title="Pauta" text={reuniao.pauta} />
                    )}

                    {reuniao.resumo && (
                      <TextBlock title="Resumo" text={reuniao.resumo} />
                    )}

                    {reuniao.decisoes && (
                      <TextBlock title="Decisões" text={reuniao.decisoes} />
                    )}

                    {reuniao.proximos_passos && (
                      <TextBlock
                        title="Próximos passos"
                        text={reuniao.proximos_passos}
                      />
                    )}

                    {reuniao.transcricao && (
                      <details style={{ marginTop: "14px" }}>
                        <summary
                          style={{
                            cursor: "pointer",
                            color: "#0f766e",
                            fontSize: "13px",
                            fontWeight: 800,
                          }}
                        >
                          Ver transcrição
                        </summary>

                        <p
                          style={{
                            margin: "10px 0 0",
                            whiteSpace: "pre-wrap",
                            color: "#475569",
                            fontSize: "13px",
                            lineHeight: 1.6,
                          }}
                        >
                          {reuniao.transcricao}
                        </p>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        {reuniaoSelecionada && (
          <section
            id="painel-revisao-tarefas"
            style={{
              marginTop: "24px",
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
                marginBottom: "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 800,
                  }}
                >
                  Revisar tarefas geradas
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  Reunião: {reuniaoSelecionada.titulo}
                </p>
              </div>

              <button
                type="button"
                onClick={cancelarRevisaoTarefas}
                style={secondaryButtonStyle}
              >
                Cancelar
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {tarefasGeradas.map((tarefa, index) => (
                <article
                  key={tarefa.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "14px",
                    background: tarefa.criar ? "#ffffff" : "#f8fafc",
                    opacity: tarefa.criar ? 1 : 0.65,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <strong style={{ fontSize: "14px" }}>
                      Tarefa {index + 1}
                    </strong>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: "#475569",
                        fontWeight: 700,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={tarefa.criar}
                        onChange={(event) =>
                          atualizarTarefaGerada(
                            tarefa.id,
                            "criar",
                            event.target.checked
                          )
                        }
                      />
                      Criar
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 0.8fr 0.6fr 0.6fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Título</label>
                      <input
                        value={tarefa.titulo}
                        onChange={(event) =>
                          atualizarTarefaGerada(
                            tarefa.id,
                            "titulo",
                            event.target.value.slice(0, 120)
                          )
                        }
                        maxLength={120}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Responsável</label>
                      <select
                        value={tarefa.responsavel_membro_id}
                        onChange={(event) =>
                          atualizarTarefaGerada(
                            tarefa.id,
                            "responsavel_membro_id",
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="">Sem responsável</option>
                        {membrosEquipe.map((membro) => (
                          <option key={membro.membro_id} value={membro.membro_id}>
                            {membro.nome}
                            {membro.cargo ? ` — ${membro.cargo}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Prioridade</label>
                      <select
                        value={tarefa.prioridade}
                        onChange={(event) =>
                          atualizarTarefaGerada(
                            tarefa.id,
                            "prioridade",
                            event.target.value
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

                    <div>
                      <label style={labelStyle}>Prazo</label>
                      <input
                        type="date"
                        value={tarefa.data_limite}
                        onChange={(event) =>
                          atualizarTarefaGerada(
                            tarefa.id,
                            "data_limite",
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <label style={labelStyle}>Descrição</label>
                    <textarea
                      value={tarefa.descricao}
                      onChange={(event) =>
                        atualizarTarefaGerada(
                          tarefa.id,
                          "descricao",
                          event.target.value
                        )
                      }
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                onClick={cancelarRevisaoTarefas}
                style={secondaryButtonStyle}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarTarefasGeradas}
                disabled={salvandoTarefas}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  background: "linear-gradient(to right, #0f766e, #14b8a6)",
                  color: "white",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: salvandoTarefas ? "not-allowed" : "pointer",
                  opacity: salvandoTarefas ? 0.75 : 1,
                }}
              >
                {salvandoTarefas ? "Criando..." : "Criar tarefas selecionadas"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginTop: "14px" }}>
      <h4
        style={{
          margin: "0 0 6px",
          fontSize: "13px",
          color: "#0f172a",
          fontWeight: 800,
        }}
      >
        {title}
      </h4>

      <p
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          color: "#475569",
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
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
        fontWeight: 800,
        padding: "5px 9px",
      }}
    >
      {text}
    </span>
  );
}

function formatarTipo(tipo: Reuniao["tipo"]) {
  const item = tipoOptions.find((option) => option.value === tipo);
  return item?.label ?? tipo;
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#0f766e",
  fontWeight: 700,
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

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  background: "white",
  color: "#64748b",
  padding: "8px 10px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
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