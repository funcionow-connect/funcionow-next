"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UsuarioAtual = { usuario_id: string; empresa_id: string };
type Projeto = { projeto_id: string; nome: string };
type MembroEquipe = { membro_id: string; nome: string; cargo: string | null; tipo_membro: string | null; status: string | null };
type Tarefa = {
  tarefa_id: string;
  projeto_id: string | null;
  titulo: string;
  descricao: string | null;
  status: "a_fazer" | "em_andamento" | "aguardando_terceiro" | "em_revisao" | "concluido" | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  data_limite: string | null;
  responsavel_membro_id: string | null;
  projetos?: { nome: string } | null;
  membros_equipe?: { nome: string; cargo: string | null; tipo_membro: string | null } | null;
};

const statusOptions = [
  { value: "a_fazer", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando_terceiro", label: "Aguardando terceiro" },
  { value: "em_revisao", label: "Em revisão" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export default function TarefasPage() {
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [membros, setMembros] = useState<MembroEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [responsavelMembroId, setResponsavelMembroId] = useState("");
  const [status, setStatus] = useState<Tarefa["status"]>("a_fazer");
  const [prioridade, setPrioridade] = useState<Tarefa["prioridade"]>("media");
  const [dataLimite, setDataLimite] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const tarefasFiltradas = useMemo(() => tarefas.filter((tarefa) => {
    const texto = busca.trim().toLowerCase();
    const bateBusca = !texto || tarefa.titulo.toLowerCase().includes(texto) || tarefa.descricao?.toLowerCase().includes(texto) || tarefa.projetos?.nome?.toLowerCase().includes(texto) || tarefa.membros_equipe?.nome?.toLowerCase().includes(texto);
    const bateStatus = statusFiltro === "todos" || tarefa.status === statusFiltro;
    return bateBusca && bateStatus;
  }), [tarefas, busca, statusFiltro]);

  const tarefasPorStatus = useMemo(() => statusOptions.map((item) => ({ ...item, tarefas: tarefasFiltradas.filter((tarefa) => tarefa.status === item.value) })), [tarefasFiltradas]);

  async function carregar() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user?.id) {
      window.location.href = "/login";
      return;
    }

    const { data: usuarioData } = await supabase
      .from("usuarios")
      .select("usuario_id, empresa_id")
      .eq("usuario_id", authData.user.id)
      .maybeSingle<UsuarioAtual>();

    if (!usuarioData?.empresa_id) {
      window.location.href = "/perfil";
      return;
    }

    setUsuario(usuarioData);

    const [projetosResult, membrosResult, tarefasResult] = await Promise.all([
      supabase.from("projetos").select("projeto_id, nome").eq("empresa_id", usuarioData.empresa_id).order("nome"),
      supabase.from("membros_equipe").select("membro_id, nome, cargo, tipo_membro, status").eq("empresa_id", usuarioData.empresa_id).eq("status", "ativo").order("nome"),
      supabase.from("tarefas").select("*, projetos(nome), membros_equipe(nome, cargo, tipo_membro)").eq("empresa_id", usuarioData.empresa_id).order("criado_em", { ascending: false }),
    ]);

    if (projetosResult.error) console.error(projetosResult.error);
    if (membrosResult.error) console.error(membrosResult.error);
    if (tarefasResult.error) console.error(tarefasResult.error);

    setProjetos((projetosResult.data ?? []) as Projeto[]);
    setMembros((membrosResult.data ?? []) as MembroEquipe[]);
    setTarefas((tarefasResult.data ?? []) as Tarefa[]);
    setLoading(false);
  }

  async function criarTarefa() {
    if (!usuario) return alert("Usuário não carregado.");
    if (!titulo.trim()) return alert("Informe o título da tarefa.");
    if (titulo.includes("use client") || titulo.includes("import ")) return alert("O título parece conter código. Revise antes de salvar.");

    const { error } = await supabase.from("tarefas").insert({
      empresa_id: usuario.empresa_id,
      projeto_id: projetoId || null,
      titulo: titulo.trim().slice(0, 120),
      descricao: descricao.trim() || null,
      status,
      prioridade,
      data_limite: dataLimite || null,
      responsavel_id: usuario.usuario_id,
      responsavel_membro_id: responsavelMembroId || null,
      criado_por: usuario.usuario_id,
    });

    if (error) {
      console.error(error);
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
    await carregar();
  }

  async function atualizarStatus(tarefaId: string, novoStatus: Tarefa["status"]) {
    const payload = novoStatus === "concluido" ? { status: novoStatus, concluido_em: new Date().toISOString() } : { status: novoStatus, concluido_em: null };
    const { error } = await supabase.from("tarefas").update(payload).eq("tarefa_id", tarefaId);
    if (error) return alert("Não foi possível atualizar a tarefa.");
    setTarefas((lista) => lista.map((tarefa) => tarefa.tarefa_id === tarefaId ? { ...tarefa, status: novoStatus } : tarefa));
  }

  useEffect(() => { carregar(); }, []);

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Operação</p>
            <h1 style={titleStyle}>Tarefas</h1>
            <p style={mutedStyle}>Acompanhe pendências, responsáveis, prazos e execução dos projetos.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}><a href="/operacao" style={linkStyle}>Dashboard</a><a href="/operacao/projetos" style={linkStyle}>Projetos</a></div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "flex-start" }}>
          <aside style={cardStyle}>
            <h2 style={panelTitleStyle}>Nova tarefa</h2>
            <label style={labelStyle}>Título</label><input value={titulo} onChange={(e) => setTitulo(e.target.value.slice(0, 120))} maxLength={120} style={inputStyle} />
            <label style={labelStyle}>Projeto</label><select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} style={inputStyle}><option value="">Sem projeto vinculado</option>{projetos.map((projeto) => <option key={projeto.projeto_id} value={projeto.projeto_id}>{projeto.nome}</option>)}</select>
            <label style={labelStyle}>Responsável</label><select value={responsavelMembroId} onChange={(e) => setResponsavelMembroId(e.target.value)} style={inputStyle}><option value="">Sem responsável definido</option>{membros.map((membro) => <option key={membro.membro_id} value={membro.membro_id}>{membro.nome}{membro.cargo ? ` — ${membro.cargo}` : ""}{membro.tipo_membro ? ` (${membro.tipo_membro})` : ""}</option>)}</select>
            <label style={labelStyle}>Descrição</label><textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Status</label><select value={status} onChange={(e) => setStatus(e.target.value as Tarefa["status"])} style={inputStyle}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
              <div><label style={labelStyle}>Prioridade</label><select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Tarefa["prioridade"])} style={inputStyle}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
            </div>
            <label style={labelStyle}>Prazo</label><input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} style={inputStyle} />
            <button onClick={criarTarefa} style={primaryButtonStyle}>Criar tarefa</button>
          </aside>

          <section>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar tarefa..." style={{ ...inputStyle, background: "white", maxWidth: 280 }} />
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} style={{ ...inputStyle, background: "white", maxWidth: 190 }}><option value="todos">Todos os status</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </div>
            {loading ? <div style={emptyStateStyle}>Carregando tarefas...</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>{tarefasPorStatus.map((coluna) => <div key={coluna.value} style={columnStyle}><h3 style={{ marginTop: 0 }}>{coluna.label} ({coluna.tarefas.length})</h3>{coluna.tarefas.map((tarefa) => <article key={tarefa.tarefa_id} style={taskCardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><h4 style={{ margin: 0 }}>{tarefa.titulo}</h4><select value={tarefa.status} onChange={(e) => atualizarStatus(tarefa.tarefa_id, e.target.value as Tarefa["status"])} style={miniSelectStyle}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>{tarefa.descricao && <p style={mutedStyle}>{tarefa.descricao}</p>}<div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}><Badge text={`Prioridade: ${tarefa.prioridade}`} />{tarefa.projetos?.nome && <Badge text={`Projeto: ${tarefa.projetos.nome}`} />}{tarefa.membros_equipe?.nome && <Badge text={`Responsável: ${tarefa.membros_equipe.nome}`} />}{tarefa.data_limite && <Badge text={`Prazo: ${formatarData(tarefa.data_limite)}`} danger={estaAtrasada(tarefa)} />}</div></article>)}</div>)}</div>}
          </section>
        </section>
      </div>
    </main>
  );
}

function Badge({ text, danger = false }: { text: string; danger?: boolean }) { return <span style={{ borderRadius: 999, background: danger ? "#fee2e2" : "#f1f5f9", color: danger ? "#b91c1c" : "#475569", fontSize: 11, fontWeight: 800, padding: "5px 8px" }}>{text}</span>; }
function formatarData(data: string) { return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR"); }
function estaAtrasada(tarefa: Tarefa) { if (!tarefa.data_limite || tarefa.status === "concluido" || tarefa.status === "cancelado") return false; const hoje = new Date(); hoje.setHours(0, 0, 0, 0); const prazo = new Date(tarefa.data_limite); prazo.setHours(0, 0, 0, 0); return prazo < hoje; }

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f8fafc", padding: 32, color: "#111827" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 24 };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: 13, color: "#0f766e", fontWeight: 700 };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" };
const mutedStyle: React.CSSProperties = { color: "#64748b", fontSize: 13, lineHeight: 1.5 };
const linkStyle: React.CSSProperties = { color: "#0f766e", fontSize: 14, textDecoration: "none", fontWeight: 800 };
const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" };
const panelTitleStyle: React.CSSProperties = { margin: "0 0 16px", fontSize: 18, fontWeight: 800 };
const labelStyle: React.CSSProperties = { display: "block", margin: "12px 0 6px", fontSize: 13, fontWeight: 700, color: "#374151" };
const inputStyle: React.CSSProperties = { width: "100%", borderRadius: 10, border: "1px solid #d1d5db", padding: "10px 12px", fontSize: 14, color: "#111827", boxSizing: "border-box" };
const primaryButtonStyle: React.CSSProperties = { width: "100%", marginTop: 14, border: "none", borderRadius: 10, padding: "11px 14px", background: "linear-gradient(to right, #0f766e, #14b8a6)", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const emptyStateStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, textAlign: "center", color: "#6b7280", fontSize: 14 };
const columnStyle: React.CSSProperties = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 16, padding: 12, minHeight: 220 };
const taskCardStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" };
const miniSelectStyle: React.CSSProperties = { borderRadius: 8, border: "1px solid #d1d5db", padding: "6px 8px", fontSize: 12, background: "#f9fafb", height: 32, maxWidth: 128 };
