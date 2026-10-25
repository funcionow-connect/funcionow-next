"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { requirePagePermission } from "@/lib/accessControl";

type Secao = "visao_geral" | "estrategia" | "publico" | "comunicacao";
type Diretriz = { diretriz_id: string; empresa_id: string; secao: Secao; rotulo: string; conteudo: string; ordem: number; ativo: boolean; criado_por: string | null };
type Empresa = { empresa_id: string; nome: string; segmento: string | null; status: string | null };

const secoes: Array<{ value: Secao; label: string; descricao: string }> = [
  { value: "visao_geral", label: "Visão geral", descricao: "A referência comum para a empresa." },
  { value: "estrategia", label: "Estratégia", descricao: "Escolhas, prioridades e direção." },
  { value: "publico", label: "Público", descricao: "Para quem a empresa existe e como se relaciona." },
  { value: "comunicacao", label: "Comunicação", descricao: "Tom, mensagens e canais da marca." },
];

const exemplos: Record<Secao, string[]> = {
  visao_geral: ["Síntese", "Missão", "Produtos", "Princípios"],
  estrategia: ["Posicionamento", "Direção", "Prioridades", "Diferencial"],
  publico: ["Para quem", "Território", "Necessidades", "Perfil principal"],
  comunicacao: ["Tese", "Tom de voz", "Canais digitais", "Mensagens-chave"],
};

export default function EmpresaPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [diretrizes, setDiretrizes] = useState<Diretriz[]>([]);
  const [secaoAtiva, setSecaoAtiva] = useState<Secao>("visao_geral");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Diretriz | null>(null);
  const [editorAberto, setEditorAberto] = useState(false);
  const [novoRotulo, setNovoRotulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { window.location.href = "/login"; return; }
    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", authData.user.id).maybeSingle<{ empresa_id: string }>();
    if (!usuario?.empresa_id) { alert("Não foi possível identificar a empresa deste usuário."); return; }
    const [{ data: empresaData, error: empresaError }, { data: diretrizesData, error: diretrizesError }] = await Promise.all([
      supabase.from("empresas").select("empresa_id, nome, segmento, status").eq("empresa_id", usuario.empresa_id).maybeSingle<Empresa>(),
      supabase.from("empresa_diretrizes").select("diretriz_id, empresa_id, secao, rotulo, conteudo, ordem, ativo, criado_por").eq("empresa_id", usuario.empresa_id).eq("ativo", true).order("ordem", { ascending: true }),
    ]);
    if (empresaError || !empresaData) { console.error(empresaError); alert("Não foi possível carregar os dados da empresa."); return; }
    if (diretrizesError) console.error("Erro ao carregar diretrizes:", diretrizesError);
    setEmpresa(empresaData); setDiretrizes((diretrizesData ?? []) as Diretriz[]); setCarregando(false);
  };

  useEffect(() => { void carregar(); }, []);
  const cards = useMemo(() => diretrizes.filter((item) => item.secao === secaoAtiva && (!busca.trim() || `${item.rotulo} ${item.conteudo}`.toLowerCase().includes(busca.trim().toLowerCase()))), [diretrizes, secaoAtiva, busca]);
  const abrirNovo = (rotulo = "") => { setEditando(null); setNovoRotulo(rotulo); setNovoConteudo(""); setEditorAberto(true); };
  const abrirEdicao = (item: Diretriz) => { setEditando(item); setNovoRotulo(item.rotulo); setNovoConteudo(item.conteudo); setEditorAberto(true); };
  const limparEditor = () => { setEditando(null); setNovoRotulo(""); setNovoConteudo(""); setEditorAberto(false); };
  const salvarDiretriz = async () => {
    if (!(await requirePagePermission("empresa", editando ? "pode_editar" : "pode_criar"))) return;
    if (!empresa || !novoRotulo.trim() || !novoConteudo.trim()) { alert("Preencha o título e o conteúdo."); return; }
    try {
      setSalvando(true);
      if (editando) {
        const { error } = await supabase.from("empresa_diretrizes").update({ rotulo: novoRotulo.trim(), conteudo: novoConteudo.trim() }).eq("diretriz_id", editando.diretriz_id);
        if (error) throw error;
      } else {
        const maiorOrdem = Math.max(0, ...diretrizes.filter((item) => item.secao === secaoAtiva).map((item) => item.ordem));
        const { data: authData } = await supabase.auth.getUser();
        const { error } = await supabase.from("empresa_diretrizes").insert({ empresa_id: empresa.empresa_id, secao: secaoAtiva, rotulo: novoRotulo.trim(), conteudo: novoConteudo.trim(), ordem: maiorOrdem + 1, criado_por: authData.user?.id ?? null });
        if (error) throw error;
      }
      limparEditor(); await carregar();
    } catch (error) { console.error(error); alert("Não foi possível salvar esta informação."); } finally { setSalvando(false); }
  };
  const excluirDiretriz = async (id: string) => {
    if (!(await requirePagePermission("empresa", "pode_excluir"))) return;
    if (!window.confirm("Excluir esta informação da empresa?")) return;
    const { error } = await supabase.from("empresa_diretrizes").update({ ativo: false }).eq("diretriz_id", id);
    if (error) { alert("Não foi possível excluir esta informação."); return; }
    setDiretrizes((lista) => lista.filter((item) => item.diretriz_id !== id));
  };

  const secao = secoes.find((item) => item.value === secaoAtiva)!;
  if (carregando) return <main style={pageStyle}><div style={shellStyle}>Carregando espaço da empresa...</div></main>;

  return <main style={pageStyle}><div style={shellStyle}>
    <header style={headerStyle}><div><p style={eyebrowStyle}>Administração · Espaço da empresa</p><h1 style={titleStyle}>A empresa.</h1><p style={subtitleStyle}>Visão, direção e organização em um só lugar.</p></div><span style={statusStyle}><span style={statusDotStyle} /> {empresa?.status === "ativo" ? "Empresa ativa" : empresa?.status || "Status não definido"}</span></header>
    <section style={identityCardStyle}><div style={identityIconStyle}>{(empresa?.nome || "E").slice(0, 1).toUpperCase()}</div><div><p style={labelStyle}>Espaço da empresa</p><h2 style={identityTitleStyle}>{empresa?.nome}</h2><p style={mutedStyle}>{empresa?.segmento || "Segmento ainda não informado"}</p></div></section>
    <section style={introStyle}><p style={eyebrowStyle}>Identidade da empresa</p><h2 style={sectionTitleStyle}>Nossa marca, num só lugar.</h2><p style={mutedStyle}>Consulte a direção da empresa antes de criar, comunicar ou decidir.</p></section>
    <div style={searchRowStyle}><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar em toda a empresa..." style={searchInputStyle} /><button type="button" onClick={() => abrirNovo()} style={primaryButtonStyle}>+ Adicionar</button></div>
    <nav style={tabsStyle}>{secoes.map((item) => <button key={item.value} type="button" onClick={() => setSecaoAtiva(item.value)} style={item.value === secaoAtiva ? activeTabStyle : tabStyle}>{item.label}</button>)}</nav>
    <section style={sectionHeaderStyle}><div><p style={eyebrowStyle}>{empresa?.nome} · {secao.label}</p><h2 style={sectionTitleStyle}>{secao.descricao}</h2></div><button type="button" onClick={() => abrirNovo()} style={secondaryButtonStyle}>Adicionar informação</button></section>
    {cards.length === 0 ? <div style={emptyStyle}><strong>Nenhuma informação cadastrada nesta seção.</strong><span>Adicione o primeiro registro para tornar este espaço útil para toda a equipe.</span><button type="button" onClick={() => abrirNovo(exemplos[secaoAtiva][0])} style={primaryButtonStyle}>Criar primeiro registro</button></div> : <div style={cardsGridStyle}>{cards.map((item) => <article key={item.diretriz_id} style={cardStyle}><div style={cardTopStyle}><p style={cardLabelStyle}>{item.rotulo}</p><div style={{ display: "flex", gap: "6px" }}><button type="button" onClick={() => abrirEdicao(item)} style={iconButtonStyle}>Editar</button><button type="button" onClick={() => excluirDiretriz(item.diretriz_id)} style={deleteButtonStyle}>Excluir</button></div></div><p style={cardContentStyle}>{item.conteudo}</p></article>)}</div>}
    {editorAberto && <div style={modalBackdropStyle}><div style={modalStyle}><div style={modalHeaderStyle}><div><p style={eyebrowStyle}>{editando ? "Editar informação" : "Nova informação"}</p><h2 style={{ margin: 0, fontSize: "22px" }}>{secao.label}</h2></div><button type="button" onClick={limparEditor} style={iconButtonStyle}>Fechar</button></div><label style={labelStyle}>Título do card</label><input value={novoRotulo} onChange={(event) => setNovoRotulo(event.target.value)} placeholder={exemplos[secaoAtiva][0]} style={inputStyle} /><label style={{ ...labelStyle, marginTop: "14px" }}>Conteúdo</label><textarea value={novoConteudo} onChange={(event) => setNovoConteudo(event.target.value)} rows={8} placeholder="Escreva a informação que a equipe deve consultar..." style={{ ...inputStyle, resize: "vertical" }} /><div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}><button type="button" onClick={limparEditor} style={secondaryButtonStyle}>Cancelar</button><button type="button" disabled={salvando} onClick={salvarDiretriz} style={primaryButtonStyle}>{salvando ? "Salvando..." : "Salvar informação"}</button></div></div></div>}
  </div></main>;
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f8fafc", padding: "32px", color: "#111827" };
const shellStyle: React.CSSProperties = { maxWidth: "1280px", margin: "0 auto" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "flex-start", marginBottom: "24px" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 8px", color: "#0f766e", fontSize: "13px", fontWeight: 700 };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "30px", letterSpacing: "-0.03em", fontWeight: 800 };
const subtitleStyle: React.CSSProperties = { margin: "8px 0 0", color: "#6b7280", fontSize: "14px", maxWidth: "680px" };
const statusStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "7px", color: "#6b7280", fontSize: "13px", fontWeight: 700 };
const statusDotStyle: React.CSSProperties = { width: "8px", height: "8px", borderRadius: "50%", background: "#84cc16" };
const identityCardStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "16px", background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "20px", marginBottom: "24px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" };
const identityIconStyle: React.CSSProperties = { width: "54px", height: "54px", borderRadius: "12px", display: "grid", placeItems: "center", background: "#ccfbf1", color: "#0f766e", fontSize: "23px", fontWeight: 900 };
const identityTitleStyle: React.CSSProperties = { margin: "2px 0 4px", fontSize: "22px", fontWeight: 800 };
const introStyle: React.CSSProperties = { marginBottom: "20px" };
const sectionTitleStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: "22px", fontWeight: 800 };
const mutedStyle: React.CSSProperties = { margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: 1.6 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "7px", color: "#374151", fontSize: "12px", fontWeight: 700 };
const searchRowStyle: React.CSSProperties = { display: "flex", gap: "12px", alignItems: "center", marginBottom: "18px" };
const searchInputStyle: React.CSSProperties = { flex: 1, maxWidth: "560px", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "13px 15px", color: "#111827", fontSize: "14px", outline: "none", background: "white" };
const tabsStyle: React.CSSProperties = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" };
const tabStyle: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: "999px", background: "white", color: "#6b7280", padding: "9px 14px", fontSize: "13px", cursor: "pointer" };
const activeTabStyle: React.CSSProperties = { ...tabStyle, background: "#ccfbf1", borderColor: "#14b8a6", color: "#0f766e", fontWeight: 700 };
const sectionHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-end", marginBottom: "15px" };
const cardsGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "15px" };
const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "18px", minHeight: "105px", boxShadow: "0 1px 2px rgba(15,23,42,0.03)" };
const cardTopStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" };
const cardLabelStyle: React.CSSProperties = { margin: 0, color: "#6b7280", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" };
const cardContentStyle: React.CSSProperties = { margin: "12px 0 0", color: "#111827", fontSize: "15px", lineHeight: 1.6 };
const emptyStyle: React.CSSProperties = { display: "grid", gap: "10px", justifyItems: "start", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "32px", color: "#6b7280", background: "white" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 12px", color: "#111827", fontSize: "14px", outline: "none" };
const primaryButtonStyle: React.CSSProperties = { border: "none", borderRadius: "8px", background: "linear-gradient(to right, #0f766e, #14b8a6)", color: "white", padding: "11px 15px", fontSize: "13px", fontWeight: 800, cursor: "pointer" };
const secondaryButtonStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: "8px", background: "white", color: "#0f766e", padding: "10px 13px", fontSize: "13px", fontWeight: 800, cursor: "pointer" };
const iconButtonStyle: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", color: "#0f766e", padding: "6px 8px", fontSize: "11px", fontWeight: 800, cursor: "pointer" };
const deleteButtonStyle: React.CSSProperties = { ...iconButtonStyle, color: "#b45353", borderColor: "#f1d3d3" };
const modalBackdropStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: "24px", background: "rgba(24,33,58,0.35)" };
const modalStyle: React.CSSProperties = { width: "min(720px, 100%)", background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 24px 80px rgba(15,23,42,0.2)" };
const modalHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "20px" };



