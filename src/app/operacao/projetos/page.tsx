"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UsuarioAtual = { usuario_id: string; empresa_id: string };
type Projeto = {
  projeto_id: string;
  nome: string;
  descricao: string | null;
  status: "ativo" | "pausado" | "concluido" | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  data_inicio: string | null;
  data_limite: string | null;
};

export default function ProjetosPage() {
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<Projeto["status"]>("ativo");
  const [prioridade, setPrioridade] = useState<Projeto["prioridade"]>("media");
  const [dataInicio, setDataInicio] = useState("");
  const [dataLimite, setDataLimite] = useState("");

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

    const { data, error } = await supabase
      .from("projetos")
      .select("projeto_id, nome, descricao, status, prioridade, data_inicio, data_limite")
      .eq("empresa_id", usuarioData.empresa_id)
      .order("criado_em", { ascending: false });

    if (error) console.error(error);
    setProjetos((data ?? []) as Projeto[]);
    setLoading(false);
  }

  async function criarProjeto() {
    if (!usuario) return alert("Usuário não carregado.");
    if (!nome.trim()) return alert("Informe o nome do projeto.");

    const { error } = await supabase.from("projetos").insert({
      empresa_id: usuario.empresa_id,
      nome: nome.trim().slice(0, 120),
      descricao: descricao.trim() || null,
      status,
      prioridade,
      data_inicio: dataInicio || null,
      data_limite: dataLimite || null,
      responsavel_id: usuario.usuario_id,
      criado_por: usuario.usuario_id,
    });

    if (error) {
      console.error(error);
      alert("Não foi possível criar o projeto.");
      return;
    }

    setNome("");
    setDescricao("");
    setStatus("ativo");
    setPrioridade("media");
    setDataInicio("");
    setDataLimite("");
    await carregar();
  }

  async function atualizarStatus(projetoId: string, novoStatus: Projeto["status"]) {
    const { error } = await supabase.from("projetos").update({ status: novoStatus }).eq("projeto_id", projetoId);
    if (error) return alert("Não foi possível atualizar o status.");
    setProjetos((lista) => lista.map((p) => (p.projeto_id === projetoId ? { ...p, status: novoStatus } : p)));
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Operação</p>
            <h1 style={titleStyle}>Projetos</h1>
            <p style={mutedStyle}>Organize as principais frentes da empresa e conecte tarefas, reuniões e prazos.</p>
          </div>
          <a href="/operacao" style={linkStyle}>Dashboard Operacional</a>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
          <aside style={cardStyle}>
            <h2 style={panelTitleStyle}>Novo projeto</h2>
            <label style={labelStyle}>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value.slice(0, 120))} style={inputStyle} />
            <label style={labelStyle}>Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Status</label><select value={status} onChange={(e) => setStatus(e.target.value as Projeto["status"])} style={inputStyle}><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></div>
              <div><label style={labelStyle}>Prioridade</label><select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Projeto["prioridade"])} style={inputStyle}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Início</label><input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Prazo</label><input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)} style={inputStyle} /></div>
            </div>
            <button onClick={criarProjeto} style={primaryButtonStyle}>Criar projeto</button>
          </aside>

          <section>
            {loading ? <div style={emptyStateStyle}>Carregando projetos...</div> : projetos.length === 0 ? <div style={emptyStateStyle}>Nenhum projeto cadastrado.</div> : (
              <div style={{ display: "grid", gap: 12 }}>
                {projetos.map((projeto) => (
                  <article key={projeto.projeto_id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{projeto.nome}</h3>
                        {projeto.descricao && <p style={mutedStyle}>{projeto.descricao}</p>}
                      </div>
                      <select value={projeto.status} onChange={(e) => atualizarStatus(projeto.projeto_id, e.target.value as Projeto["status"])} style={inputStyle}>
                        <option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge text={`Status: ${projeto.status}`} />
                      <Badge text={`Prioridade: ${projeto.prioridade}`} />
                      {projeto.data_limite && <Badge text={`Prazo: ${formatarData(projeto.data_limite)}`} />}
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

function Badge({ text }: { text: string }) {
  return <span style={{ borderRadius: 999, background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700, padding: "6px 10px" }}>{text}</span>;
}

function formatarData(data: string) { return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR"); }

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f8fafc", padding: 32, color: "#111827" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", marginBottom: 24 };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: 13, color: "#0f766e", fontWeight: 700 };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" };
const mutedStyle: React.CSSProperties = { color: "#6b7280", fontSize: 14 };
const linkStyle: React.CSSProperties = { color: "#0f766e", fontSize: 14, textDecoration: "none", fontWeight: 700 };
const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" };
const panelTitleStyle: React.CSSProperties = { margin: "0 0 16px", fontSize: 18, fontWeight: 800 };
const labelStyle: React.CSSProperties = { display: "block", margin: "12px 0 6px", fontSize: 13, fontWeight: 700, color: "#374151" };
const inputStyle: React.CSSProperties = { width: "100%", borderRadius: 10, border: "1px solid #d1d5db", padding: "10px 12px", fontSize: 14, color: "#111827", boxSizing: "border-box" };
const primaryButtonStyle: React.CSSProperties = { width: "100%", marginTop: 14, border: "none", borderRadius: 10, padding: "11px 14px", background: "linear-gradient(to right, #0f766e, #14b8a6)", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const emptyStateStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, textAlign: "center", color: "#6b7280", fontSize: 14 };
