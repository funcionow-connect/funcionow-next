"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Empresa = { empresa_id: string; nome: string; segmento: string | null; status: string | null; criada_em: string | null };

export default function EmpresaPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [nome, setNome] = useState("");
  const [segmento, setSegmento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregarEmpresa = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { window.location.href = "/login"; return; }
    const { data: usuario, error: usuarioError } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", authData.user.id).maybeSingle<{ empresa_id: string }>();
    if (usuarioError || !usuario?.empresa_id) { alert("Não foi possível identificar a empresa deste usuário."); return; }
    const { data, error } = await supabase.from("empresas").select("empresa_id, nome, segmento, status, criada_em").eq("empresa_id", usuario.empresa_id).maybeSingle<Empresa>();
    if (error || !data) { console.error("Erro ao carregar empresa:", error); alert("Não foi possível carregar os dados da empresa."); return; }
    setEmpresa(data); setNome(data.nome); setSegmento(data.segmento ?? ""); setCarregando(false);
  };

  useEffect(() => { void carregarEmpresa(); }, []);

  const salvarEmpresa = async () => {
    if (!empresa || !nome.trim()) { alert("Informe o nome da empresa."); return; }
    try {
      setSalvando(true);
      const { error } = await supabase.from("empresas").update({ nome: nome.trim(), segmento: segmento.trim() || null }).eq("empresa_id", empresa.empresa_id);
      if (error) { console.error("Erro ao salvar empresa:", error); alert("Não foi possível salvar os dados da empresa."); return; }
      setEmpresa((atual) => atual ? { ...atual, nome: nome.trim(), segmento: segmento.trim() || null } : atual);
      alert("Dados da empresa atualizados.");
    } finally { setSalvando(false); }
  };

  if (carregando) return <main style={pageStyle}><div style={shellStyle}>Carregando espaço da empresa...</div></main>;

  return <main style={pageStyle}><div style={shellStyle}>
    <header style={headerStyle}><div><p style={eyebrowStyle}>Administração · Espaço da empresa</p><h1 style={titleStyle}>A empresa.</h1><p style={subtitleStyle}>Identidade, direção e organização da empresa em um só lugar.</p></div><span style={statusStyle}><span style={statusDotStyle} /> {empresa?.status === "ativo" ? "Empresa ativa" : empresa?.status || "Status não definido"}</span></header>
    <section style={identityCardStyle}><div style={identityIconStyle}>{(empresa?.nome || "E").slice(0, 1).toUpperCase()}</div><div><p style={labelStyle}>Espaço da empresa</p><h2 style={identityTitleStyle}>{empresa?.nome}</h2><p style={mutedStyle}>{empresa?.segmento || "Segmento ainda não informado"}</p></div></section>
    <section style={contentGridStyle}><div style={mainCardStyle}><p style={eyebrowStyle}>Identidade da empresa</p><h2 style={sectionTitleStyle}>Nossa marca, num só lugar.</h2><p style={mutedStyle}>Essas informações serão usadas como referência para organizar a operação e personalizar a experiência da equipe.</p><div style={formGridStyle}><div><label style={labelStyle}>Nome da empresa</label><input value={nome} onChange={(event) => setNome(event.target.value)} style={inputStyle} /></div><div><label style={labelStyle}>Segmento</label><input value={segmento} onChange={(event) => setSegmento(event.target.value)} placeholder="Ex.: Saúde e bem-estar" style={inputStyle} /></div></div><div style={brandPlaceholderStyle}><strong>Logo e identidade visual</strong><span>Em breve: configure a logo, cor principal e assinatura visual da empresa.</span></div><div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}><button type="button" onClick={salvarEmpresa} disabled={salvando} style={primaryButtonStyle}>{salvando ? "Salvando..." : "Salvar dados da empresa"}</button></div></div><aside style={sideCardStyle}><p style={eyebrowStyle}>Próximas configurações</p><h2 style={sideTitleStyle}>Direção e contexto.</h2><p style={mutedStyle}>Este espaço será ampliado para reunir posicionamento, público, missão, produtos, princípios e referências da marca.</p><a href="/configuracoes" style={secondaryLinkStyle}>Abrir configurações administrativas</a></aside></section>
  </div></main>;
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f8fafc", padding: "32px", color: "#111827" };
const shellStyle: React.CSSProperties = { maxWidth: "1280px", margin: "0 auto" };
const headerStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "flex-start", marginBottom: "28px" };
const eyebrowStyle: React.CSSProperties = { margin: "0 0 8px", color: "#6d28d9", fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "36px", letterSpacing: "-0.05em", fontWeight: 900 };
const subtitleStyle: React.CSSProperties = { margin: "8px 0 0", color: "#64748b", fontSize: "15px" };
const statusStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "7px", color: "#475569", fontSize: "13px", fontWeight: 700 };
const statusDotStyle: React.CSSProperties = { width: "8px", height: "8px", borderRadius: "50%", background: "#84cc16" };
const identityCardStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "16px", background: "#ede9fe", border: "1px solid #ddd6fe", borderRadius: "18px", padding: "22px", marginBottom: "20px" };
const identityIconStyle: React.CSSProperties = { width: "56px", height: "56px", borderRadius: "16px", display: "grid", placeItems: "center", background: "#d9ccf8", color: "#4c1d95", fontSize: "24px", fontWeight: 900 };
const identityTitleStyle: React.CSSProperties = { margin: "2px 0 4px", fontSize: "24px", fontWeight: 900 };
const contentGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "20px", alignItems: "start" };
const mainCardStyle: React.CSSProperties = { background: "white", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "26px", boxShadow: "0 5px 18px rgba(15,23,42,0.04)" };
const sideCardStyle: React.CSSProperties = { background: "#f1edfb", border: "1px solid #ddd6fe", borderRadius: "18px", padding: "22px" };
const sectionTitleStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: "25px", fontWeight: 900 };
const sideTitleStyle: React.CSSProperties = { margin: "0 0 8px", fontSize: "20px", fontWeight: 900 };
const mutedStyle: React.CSSProperties = { margin: 0, color: "#64748b", fontSize: "14px", lineHeight: 1.6 };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "7px", color: "#475569", fontSize: "12px", fontWeight: 800 };
const formGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px", marginTop: "24px" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d8d1ec", borderRadius: "11px", padding: "12px 13px", color: "#111827", fontSize: "14px", outline: "none" };
const brandPlaceholderStyle: React.CSSProperties = { display: "grid", gap: "5px", marginTop: "18px", border: "1px dashed #c4b5fd", borderRadius: "13px", padding: "16px", background: "#faf8ff", color: "#5b21b6", fontSize: "13px" };
const primaryButtonStyle: React.CSSProperties = { border: "none", borderRadius: "10px", background: "#6d4bb3", color: "white", padding: "11px 15px", fontSize: "13px", fontWeight: 800, cursor: "pointer" };
const secondaryLinkStyle: React.CSSProperties = { display: "inline-flex", marginTop: "18px", color: "#6d4bb3", fontSize: "13px", fontWeight: 800, textDecoration: "none" };
