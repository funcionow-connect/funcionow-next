"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Campaign = { campanha_id: string; nome: string; status: string; orcamento: number | null; receita: number | null; criado_em: string; data_inicio: string | null; data_fim: string | null };
type Deliverable = { titulo: string; status: string; prazo: string | null; campanha_id: string };
type Creator = { creator_id: string; nome: string; status: string; score_total: number | null };
type CreatorPerformance = { creator_id: string; custo: number | null; receita: number | null; alcance: number | null; cliques: number | null; conversoes: number | null };
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`)) : "Sem prazo";
const statusLabels: Record<string, string> = { ativa: "Ativa", planejada: "Planejada", finalizada: "Finalizada", cancelada: "Cancelada", pendente: "Pendente", em_producao: "Em produção", entregue: "Entregue", aprovado: "Aprovado", reprovado: "Reprovado" };

export default function InsightsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorPerformance, setCreatorPerformance] = useState<CreatorPerformance[]>([]);
  const [performanceAvailable, setPerformanceAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  useEffect(() => { const load = async () => { const { data: { session } } = await supabase.auth.getSession(); if (!session?.user) { setError("Faça login para visualizar os insights."); setLoading(false); return; } const { data: user } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle(); if (!user?.empresa_id) { setError("Não foi possível identificar a empresa."); setLoading(false); return; } const [{ data: campaignData }, { data: creatorData }] = await Promise.all([supabase.from("campanhas").select("campanha_id, nome, status, orcamento, receita, criado_em, data_inicio, data_fim").eq("empresa_id", user.empresa_id).order("receita", { ascending: false }), supabase.from("creators").select("creator_id, nome, status, score_total").eq("empresa_id", user.empresa_id).order("score_total", { ascending: false, nullsFirst: false })]); const ids = (campaignData || []).map((item) => item.campanha_id); const [{ data: deliverableData }, { data: performanceData, error: performanceError }] = ids.length ? await Promise.all([supabase.from("campanha_entregaveis").select("titulo, status, prazo, campanha_id").in("campanha_id", ids).order("prazo", { ascending: true }), supabase.from("campanha_creators").select("creator_id, custo, receita, alcance, cliques, conversoes").in("campanha_id", ids)]) : [{ data: [] }, { data: [], error: null }]; setCampaigns(campaignData || []); setCreators(creatorData || []); setDeliverables(deliverableData || []); if (performanceError) setPerformanceAvailable(false); else setCreatorPerformance(performanceData || []); setLoading(false); }; void load(); }, []);
  const filteredCampaigns = useMemo(() => campaigns.filter((item) => { const days = period === "30" ? 30 : period === "90" ? 90 : null; if (!days) return statusFilter === "todos" || item.status === statusFilter; const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); cutoff.setDate(cutoff.getDate() - days); const start = item.data_inicio ? new Date(`${item.data_inicio}T00:00:00`) : new Date(item.criado_em); const end = item.data_fim ? new Date(`${item.data_fim}T23:59:59`) : start; const overlapsPeriod = end >= cutoff && start <= new Date(); return overlapsPeriod && (statusFilter === "todos" || item.status === statusFilter); }), [campaigns, period, statusFilter]);
  const totals = useMemo(() => { const budget = filteredCampaigns.reduce((sum, item) => sum + Number(item.orcamento || 0), 0); const revenue = filteredCampaigns.reduce((sum, item) => sum + Number(item.receita || 0), 0); return { budget, revenue, roi: budget ? `${(revenue / budget).toFixed(1)}x` : "—", active: filteredCampaigns.filter((item) => item.status === "ativa").length }; }, [filteredCampaigns]);
  const pending = deliverables.filter((item) => !["entregue", "aprovado"].includes(item.status));
  const overdue = pending.filter((item) => item.prazo && new Date(`${item.prazo}T23:59:59`).getTime() < Date.now());
  const performanceRanking = useMemo(() => creatorPerformance.map((item) => ({ ...item, creator: creators.find((creator) => creator.creator_id === item.creator_id) })).filter((item) => item.creator).sort((a, b) => Number(b.receita || 0) - Number(a.receita || 0)), [creatorPerformance, creators]);
  const maxChartValue = Math.max(1, ...filteredCampaigns.slice(0, 6).flatMap((item) => [Number(item.orcamento || 0), Number(item.receita || 0)]));
  if (loading) return <div style={empty}>Carregando insights...</div>;
  if (error) return <div style={errorBox}>{error}</div>;
  return <div><div style={header}><div><h1 style={title}>Insights</h1><p style={subtitle}>Leitura dos resultados reais de campanhas, creators e entregáveis.</p></div><span style={updated}>Dados do Supabase</span></div>
    {!performanceAvailable && <div style={migrationNotice}>As métricas individuais de creators ainda não estão disponíveis. Execute a migration <strong>11_campanha_creator_performance.sql</strong> no Supabase para habilitar receita, custo, alcance, cliques e conversões por creator.</div>}
    <div style={filters}><select value={period} onChange={(event) => setPeriod(event.target.value)} style={filter}><option value="todos">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={filter}><option value="todos">Todos os status</option>{Object.entries(statusLabels).filter(([key]) => ["ativa", "planejada", "finalizada", "cancelada"].includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span style={hint}>{filteredCampaigns.length} campanha(s) no recorte</span></div>
    <div style={metrics}><Metric label="Receita total" value={money(totals.revenue)} /><Metric label="Investimento" value={money(totals.budget)} /><Metric label="ROI geral" value={totals.roi} /><Metric label="Campanhas ativas" value={totals.active} /></div>
    <div style={grid}><section style={card}><div style={sectionHeader}><strong>Campanhas por desempenho</strong><span style={hint}>{filteredCampaigns.length} cadastradas</span></div>{filteredCampaigns.length ? filteredCampaigns.slice(0, 6).map((item) => <div key={item.campanha_id} style={row}><div><Link href={`/campanhas/detail?id=${item.campanha_id}`} style={actionLink}><strong>{item.nome}</strong></Link><small>{statusLabels[item.status] || item.status}</small></div><div style={right}><b>{money(Number(item.receita || 0))}</b><small>{item.orcamento ? `${(Number(item.receita || 0) / Number(item.orcamento)).toFixed(1)}x ROI` : "Sem orçamento"}</small></div></div>) : <div style={muted}>Nenhuma campanha corresponde ao filtro.</div>}</section>
      <section style={card}><div style={sectionHeader}><strong>{performanceRanking.length ? "Creators por receita" : "Creators em destaque"}</strong><span style={hint}>{creators.length} cadastrados</span></div>{performanceRanking.length ? performanceRanking.slice(0, 6).map((item) => <div key={item.creator_id} style={row}><div><Link href={`/creators/detail?creator_id=${item.creator_id}`} style={actionLink}><strong>{item.creator?.nome || "Sem nome"}</strong></Link><small>{money(Number(item.receita || 0))} · {item.custo ? `${(Number(item.receita || 0) / Number(item.custo)).toFixed(1)}x ROI` : "Sem custo"}</small></div><div style={right}><b>{item.conversoes || 0}</b><small>conversões</small></div></div>) : creators.slice(0, 6).map((creator) => <div key={creator.creator_id} style={row}><div><Link href={`/creators/detail?creator_id=${creator.creator_id}`} style={actionLink}><strong>{creator.nome || "Sem nome"}</strong></Link><small>{statusLabels[creator.status] || creator.status || "Sem status"}</small></div><div style={right}><b>{creator.score_total ?? "—"}</b><small>score</small></div></div>)}{!creators.length && <div style={muted}>Cadastre creators para comparar desempenho.</div>}</section>
    </div>
    <section style={{ ...card, marginTop: "12px" }}><div style={sectionHeader}><strong>Orçamento x receita</strong><span style={hint}>As 6 principais campanhas</span></div>{filteredCampaigns.length ? <div style={chart}>{filteredCampaigns.slice(0, 6).map((item) => { const budget = Number(item.orcamento || 0); const revenue = Number(item.receita || 0); return <div key={item.campanha_id} style={chartRow}><div style={chartLabel}>{item.nome}</div><div style={bars}><div style={barTrack}><div style={{ ...barBudget, width: `${Math.max(3, (budget / maxChartValue) * 100)}%` }} /></div><div style={barTrack}><div style={{ ...barRevenue, width: `${Math.max(3, (revenue / maxChartValue) * 100)}%` }} /></div></div><div style={chartValues}><span>{money(budget)}</span><span>{money(revenue)}</span></div></div>})}</div> : <div style={muted}>Cadastre campanhas para visualizar o comparativo.</div>}<div style={legend}><span><i style={legendBudget} /> Orçamento</span><span><i style={legendRevenue} /> Receita</span></div></section>
    <section style={{ ...card, marginTop: "12px" }}><div style={sectionHeader}><strong>Entregáveis que exigem atenção</strong><span style={{ ...hint, color: overdue.length ? "#b45309" : "#94a3b8" }}>{pending.length} pendentes · {overdue.length} atrasados</span></div>{pending.slice(0, 8).map((item, index) => <div key={`${item.campanha_id}-${item.titulo}-${index}`} style={row}><div><Link href={`/campanhas/detail?id=${item.campanha_id}`} style={actionLink}><strong>{item.titulo}</strong></Link><small>{statusLabels[item.status] || item.status}</small></div><div style={{ ...deadline, color: item.prazo && new Date(`${item.prazo}T23:59:59`).getTime() < Date.now() ? "#b45309" : "#64748b" }}>{date(item.prazo)}</div></div>)}{!pending.length && <div style={muted}>Nenhum entregável pendente.</div>}</section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div style={metric}><span>{label}</span><strong>{value}</strong></div>; }
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "16px" };
const title = { fontSize: "22px", fontWeight: 700, margin: 0 };
const subtitle = { fontSize: "12px", color: "#6b7280", marginTop: "4px" };
const updated = { color: "#0f766e", background: "#ecfdf5", borderRadius: "999px", padding: "5px 9px", fontSize: "10px", fontWeight: 600 };
const migrationNotice = { marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e", fontSize: "11px", lineHeight: 1.5 };
const filters = { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const, marginBottom: "12px" };
const filter = { border: "1px solid #d1d5db", borderRadius: "7px", padding: "8px 10px", fontSize: "11px", background: "white" };
const actionLink = { color: "#0f766e", textDecoration: "none" };
const chart = { display: "grid", gap: "12px", marginTop: "14px" };
const chartRow = { display: "grid", gridTemplateColumns: "150px minmax(0, 1fr) 150px", gap: "10px", alignItems: "center" };
const chartLabel = { fontSize: "11px", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const };
const bars = { display: "grid", gap: "4px" };
const barTrack = { height: "7px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" };
const barBudget = { height: "100%", background: "#94a3b8", borderRadius: "999px" };
const barRevenue = { height: "100%", background: "#0f766e", borderRadius: "999px" };
const chartValues = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "10px", color: "#64748b", textAlign: "right" as const };
const legend = { display: "flex", gap: "14px", marginTop: "12px", fontSize: "10px", color: "#64748b" };
const legendBudget = { display: "inline-block", width: "8px", height: "8px", borderRadius: "999px", background: "#94a3b8", marginRight: "4px" };
const legendRevenue = { display: "inline-block", width: "8px", height: "8px", borderRadius: "999px", background: "#0f766e", marginRight: "4px" };
const metrics = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "12px" };
const metric = { display: "grid", gap: "4px", background: "white", border: "1px solid #e5e7eb", borderRadius: "9px", padding: "11px", fontSize: "10px", color: "#6b7280" };
const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" };
const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "13px" };
const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", fontSize: "13px" };
const hint = { color: "#94a3b8", fontSize: "10px", fontWeight: 400 };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: "12px" };
const right = { display: "grid", textAlign: "right" as const, gap: "2px" };
const small = { display: "block", color: "#94a3b8", fontSize: "10px", marginTop: "3px" };
const deadline = { color: "#64748b", fontSize: "11px" };
const muted = { color: "#94a3b8", fontSize: "12px", padding: "14px 0" };
const empty = { background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px" };
const errorBox = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "10px", fontSize: "12px" };
