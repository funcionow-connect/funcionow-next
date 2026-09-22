"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Status = "planejada" | "ativa" | "finalizada" | "cancelada";
type Campanha = { campanha_id: string; nome: string; descricao: string | null; status: Status; data_inicio: string | null; data_fim: string | null; orcamento: number | null; receita: number | null };
type Resumo = Campanha & { creators: number; total: number; concluidos: number };
const labels: Record<Status, string> = { planejada: "Planejada", ativa: "Ativa", finalizada: "Finalizada", cancelada: "Cancelada" };
const money = (value: number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Resumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<Status>("planejada");
  const [orcamento, setOrcamento] = useState("");
  const [receita, setReceita] = useState("");

  const loadCampanhas = async () => {
    setLoading(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setError("Faça login para visualizar as campanhas."); setLoading(false); return; }
    const { data: usuario, error: usuarioError } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle();
    if (usuarioError || !usuario?.empresa_id) { setError("Não foi possível identificar a empresa deste usuário."); setLoading(false); return; }
    const { data, error: campanhasError } = await supabase.from("campanhas").select("campanha_id, nome, descricao, status, data_inicio, data_fim, orcamento, receita").eq("empresa_id", usuario.empresa_id).order("criado_em", { ascending: false });
    if (campanhasError) { setError("A estrutura de campanhas ainda não foi aplicada no Supabase."); setLoading(false); return; }
    const ids = (data || []).map((item) => item.campanha_id);
    const [{ data: vinculados }, { data: entregaveis }] = ids.length ? await Promise.all([
      supabase.from("campanha_creators").select("campanha_id").in("campanha_id", ids),
      supabase.from("campanha_entregaveis").select("campanha_id, status").in("campanha_id", ids),
    ]) : [{ data: [] }, { data: [] }];
    setCampanhas((data || []).map((item) => ({ ...item, creators: (vinculados || []).filter((row) => row.campanha_id === item.campanha_id).length, total: (entregaveis || []).filter((row) => row.campanha_id === item.campanha_id).length, concluidos: (entregaveis || []).filter((row) => row.campanha_id === item.campanha_id && ["entregue", "aprovado"].includes(row.status)).length })));
    setLoading(false);
  };

  useEffect(() => { void loadCampanhas(); }, []);
  const totals = useMemo(() => ({ ativas: campanhas.filter((item) => item.status === "ativa").length, creators: campanhas.reduce((sum, item) => sum + item.creators, 0), receita: campanhas.reduce((sum, item) => sum + Number(item.receita || 0), 0) }), [campanhas]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault(); if (!nome.trim()) return; setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data: usuario } = session?.user ? await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle() : { data: null };
    const result = usuario?.empresa_id ? await supabase.from("campanhas").insert({ nome: nome.trim(), status, empresa_id: usuario.empresa_id, orcamento: Number(orcamento) || 0, receita: Number(receita) || 0 }) : { error: new Error("Usuário sem empresa") };
    setSaving(false); if (result.error) { setError(result.error.message); return; }
    setNome(""); setOrcamento(""); setReceita(""); setShowForm(false); await loadCampanhas();
  };

  return <div>
    <div style={header}><div><h1 style={title}>Campanhas</h1><p style={subtitle}>Acompanhe campanhas e resultados da empresa.</p></div><button style={primaryButton} onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar" : "+ Nova campanha"}</button></div>
    {showForm && <form onSubmit={handleCreate} style={formCard}><input required value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Nome da campanha" style={input} /><select value={status} onChange={(event) => setStatus(event.target.value as Status)} style={input}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input type="number" min="0" value={orcamento} onChange={(event) => setOrcamento(event.target.value)} placeholder="Orçamento (R$)" style={input} /><input type="number" min="0" value={receita} onChange={(event) => setReceita(event.target.value)} placeholder="Receita prevista (R$)" style={input} /><button disabled={saving} style={primaryButton}>{saving ? "Salvando..." : "Salvar campanha"}</button></form>}
    {error && <div style={errorBox}>{error}</div>}
    <div style={summaryGrid}><Metric label="Campanhas ativas" value={totals.ativas} /><Metric label="Creators vinculados" value={totals.creators} /><Metric label="Receita prevista" value={money(totals.receita)} /></div>
    {loading ? <div style={empty}>Carregando campanhas...</div> : campanhas.length === 0 ? <div style={empty}>Nenhuma campanha cadastrada ainda.</div> : <div style={grid}>{campanhas.map((campanha) => <Link key={campanha.campanha_id} href={`/campanhas/detail?id=${campanha.campanha_id}`} style={card}><div style={cardTop}><strong>{campanha.nome}</strong><span style={statusStyle(campanha.status)}>{labels[campanha.status]}</span></div><div style={metrics}><Metric label="Creators" value={campanha.creators} /><Metric label="Entregáveis" value={`${campanha.concluidos}/${campanha.total}`} /><Metric label="ROI" value={campanha.orcamento ? `${((Number(campanha.receita || 0) / Number(campanha.orcamento)) || 0).toFixed(1)}x` : "-"} /></div><div style={footer}><span>Custo: {money(campanha.orcamento)}</span><span>Receita: {money(campanha.receita)}</span></div></Link>)}</div>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div style={metric}><span>{label}</span><strong>{value}</strong></div>; }
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px" };
const title = { fontSize: "22px", fontWeight: 700, margin: 0 };
const subtitle = { fontSize: "12px", color: "#6b7280", marginTop: "4px" };
const primaryButton = { border: "none", borderRadius: "8px", background: "#2d1b69", color: "white", padding: "10px 14px", cursor: "pointer", fontWeight: 700 };
const formCard = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "8px", background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px", marginBottom: "14px" };
const input = { minWidth: 0, border: "1px solid #d1d5db", borderRadius: "7px", padding: "9px 10px", fontSize: "12px", background: "white" };
const errorBox = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "10px", fontSize: "12px", marginBottom: "12px" };
const summaryGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "14px" };
const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" };
const card = { display: "block", color: "inherit", textDecoration: "none", background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" };
const cardTop = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", fontSize: "13px" };
const metrics = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "12px" };
const metric = { display: "grid", gap: "4px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "9px", textAlign: "center" as const, fontSize: "10px", color: "#6b7280" };
const footer = { display: "flex", justifyContent: "space-between", marginTop: "12px", color: "#6b7280", fontSize: "11px" };
const empty = { background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px" };
const statusStyle = (status: Status) => ({ background: status === "ativa" ? "#dcfce7" : status === "planejada" ? "#e0f2fe" : status === "cancelada" ? "#fee2e2" : "#f3f4f6", color: status === "ativa" ? "#166534" : status === "planejada" ? "#0369a1" : status === "cancelada" ? "#991b1b" : "#374151", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 });
