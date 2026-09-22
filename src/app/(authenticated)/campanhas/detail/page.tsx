"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Campaign = { campanha_id: string; nome: string; descricao: string | null; status: string; data_inicio: string | null; data_fim: string | null; orcamento: number | null; receita: number | null };
type CampaignCreator = { campanha_creator_id: string; creator_id: string; status: string; nome: string; instagram: string };
type Deliverable = { entregavel_id: string; titulo: string; status: string; prazo: string | null; custo: number | null; receita: number | null; creator_id: string | null };

const money = (value: number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`)) : "-";
const statusLabels: Record<string, string> = { planejada: "Planejada", ativa: "Ativa", finalizada: "Finalizada", cancelada: "Cancelada", convidado: "Convidado", aprovado: "Aprovado", reprovado: "Reprovado", concluido: "Concluído", pendente: "Pendente", em_producao: "Em produção", entregue: "Entregue" };

export default function CampanhaDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [creators, setCreators] = useState<CampaignCreator[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState("pendente");
  const [newDeadline, setNewDeadline] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newRevenue, setNewRevenue] = useState("");
  const [newCreator, setNewCreator] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) { setError("Campanha não informada."); setLoading(false); return; }
      setLoading(true); setError("");
      const { data, error: campaignError } = await supabase.from("campanhas").select("campanha_id, nome, descricao, status, data_inicio, data_fim, orcamento, receita").eq("campanha_id", id).maybeSingle();
      if (campaignError || !data) { setError("Não foi possível carregar esta campanha."); setLoading(false); return; }
      const [{ data: links, error: linksError }, { data: items, error: itemsError }] = await Promise.all([
        supabase.from("campanha_creators").select("campanha_creator_id, creator_id, status").eq("campanha_id", id),
        supabase.from("campanha_entregaveis").select("entregavel_id, titulo, status, prazo, custo, receita, creator_id").eq("campanha_id", id).order("prazo", { ascending: true }),
      ]);
      if (linksError || itemsError) { setError("A campanha foi encontrada, mas os dados complementares não puderam ser carregados."); setCampaign(data); setLoading(false); return; }
      const creatorIds = (links || []).map((item) => item.creator_id);
      const { data: people } = creatorIds.length ? await supabase.from("creators").select("creator_id, nome, instagram").in("creator_id", creatorIds) : { data: [] };
      const peopleById = new Map((people || []).map((person) => [person.creator_id, person]));
      setCampaign(data);
      setCreators((links || []).map((item) => ({ ...item, nome: peopleById.get(item.creator_id)?.nome || "Creator sem nome", instagram: peopleById.get(item.creator_id)?.instagram || "-" })));
      setDeliverables(items || []);
      setLoading(false);
    };
    void load();
  }, [id]);

  const completed = deliverables.filter((item) => ["entregue", "aprovado"].includes(item.status)).length;
  const roi = useMemo(() => campaign?.orcamento ? (Number(campaign.receita || 0) / Number(campaign.orcamento)).toFixed(1) : "-", [campaign]);

  const addDeliverable = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !newTitle.trim()) return;
    setSaving(true); setError("");
    const { data, error: insertError } = await supabase.from("campanha_entregaveis").insert({ campanha_id: id, titulo: newTitle.trim(), status: newStatus, prazo: newDeadline || null, custo: Number(newCost) || 0, receita: Number(newRevenue) || 0, creator_id: newCreator || null }).select("entregavel_id, titulo, status, prazo, custo, receita, creator_id").single();
    if (insertError || !data) { setError(insertError?.message || "Não foi possível criar o entregável."); setSaving(false); return; }
    setDeliverables((current) => [...current, data].sort((a, b) => (a.prazo || "9999").localeCompare(b.prazo || "9999")));
    setNewTitle(""); setNewDeadline(""); setNewCost(""); setNewRevenue(""); setNewCreator(""); setNewStatus("pendente"); setShowForm(false); setSaving(false);
  };

  const updateDeliverableStatus = async (item: Deliverable, status: string) => {
    const { error: updateError } = await supabase.from("campanha_entregaveis").update({ status }).eq("entregavel_id", item.entregavel_id);
    if (updateError) { setError("Não foi possível atualizar o status do entregável."); return; }
    setDeliverables((current) => current.map((entry) => entry.entregavel_id === item.entregavel_id ? { ...entry, status } : entry));
  };

  if (loading) return <div style={empty}>Carregando campanha...</div>;
  if (error || !campaign) return <div><Link href="/campanhas" style={back}>← Voltar para campanhas</Link><div style={errorBox}>{error || "Campanha não encontrada."}</div></div>;

  return <div>
    <Link href="/campanhas" style={back}>← Voltar para campanhas</Link>
    <div style={header}><div><div style={eyebrow}>Detalhe da campanha</div><h1 style={title}>{campaign.nome}</h1><p style={subtitle}>{campaign.descricao || "Acompanhe creators, entregáveis e resultados desta campanha."}</p><p style={period}>{date(campaign.data_inicio)} — {date(campaign.data_fim)}</p></div><span style={statusStyle(campaign.status)}>{statusLabels[campaign.status] || campaign.status}</span></div>
    <div style={summaryGrid}><Metric label="Creators" value={creators.length} /><Metric label="Entregáveis" value={`${completed}/${deliverables.length}`} /><Metric label="ROI" value={roi === "-" ? roi : `${roi}x`} /><Metric label="Receita" value={money(campaign.receita)} /></div>
    <div style={grid}>
      <div style={card}><div style={sectionTitle}>Creators da campanha</div>{creators.length === 0 ? <div style={muted}>Nenhum creator vinculado.</div> : <div style={list}>{creators.map((creator) => <div key={creator.campanha_creator_id} style={row}><div><strong>{creator.nome}</strong><small style={small}>@{creator.instagram || "-"}</small></div><span style={statusStyle(creator.status)}>{statusLabels[creator.status] || creator.status}</span></div>)}</div>}</div>
      <div style={card}><div style={sectionTitle}>Financeiro</div><div style={info}><InfoRow label="Orçamento" value={money(campaign.orcamento)} /><InfoRow label="Receita" value={money(campaign.receita)} /><InfoRow label="ROI" value={roi === "-" ? roi : `${roi}x`} /><InfoRow label="Status" value={statusLabels[campaign.status] || campaign.status} /></div></div>
    </div>
    <div style={{ ...card, marginTop: "14px" }}><div style={sectionHeader}><div style={sectionTitle}>Entregáveis</div><button type="button" style={secondaryButton} onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar" : "+ Adicionar"}</button></div>
      {showForm && <form onSubmit={addDeliverable} style={form}><input required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Título do entregável" style={input} /><select value={newCreator} onChange={(event) => setNewCreator(event.target.value)} style={input}><option value="">Creator responsável (opcional)</option>{creators.map((creator) => <option key={creator.creator_id} value={creator.creator_id}>{creator.nome}</option>)}</select><select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} style={input}>{["pendente", "em_producao", "entregue", "aprovado", "reprovado"].map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select><input type="date" value={newDeadline} onChange={(event) => setNewDeadline(event.target.value)} style={input} /><input type="number" min="0" value={newCost} onChange={(event) => setNewCost(event.target.value)} placeholder="Custo" style={input} /><input type="number" min="0" value={newRevenue} onChange={(event) => setNewRevenue(event.target.value)} placeholder="Receita" style={input} /><button disabled={saving} style={primaryButton}>{saving ? "Salvando..." : "Salvar entregável"}</button></form>}
      {deliverables.length === 0 ? <div style={muted}>Nenhum entregável cadastrado.</div> : <div style={list}>{deliverables.map((item) => <div key={item.entregavel_id} style={row}><div><strong>{item.titulo}</strong><small style={small}>Prazo: {date(item.prazo)} · Custo: {money(item.custo)}</small></div><select aria-label={`Status de ${item.titulo}`} value={item.status} onChange={(event) => void updateDeliverableStatus(item, event.target.value)} style={statusSelect}>{["pendente", "em_producao", "entregue", "aprovado", "reprovado"].map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></div>)}</div>}
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div style={metric}><span>{label}</span><strong>{value}</strong></div>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div style={infoRow}><span>{label}</span><strong>{value}</strong></div>; }
const back = { display: "inline-block", color: "#5b21b6", fontSize: "12px", textDecoration: "none", marginBottom: "14px" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" };
const eyebrow = { color: "#6b7280", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" };
const title = { fontSize: "22px", fontWeight: 700, margin: "4px 0 0" };
const subtitle = { fontSize: "12px", color: "#6b7280", margin: "5px 0 0" };
const period = { fontSize: "11px", color: "#6b7280", margin: "8px 0 0" };
const summaryGrid = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" };
const metric = { display: "grid", gap: "4px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "11px", textAlign: "center" as const, fontSize: "10px", color: "#6b7280" };
const grid = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" };
const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" };
const sectionTitle = { fontSize: "13px", fontWeight: 700 };
const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" };
const secondaryButton = { border: "1px solid #d1d5db", borderRadius: "7px", background: "white", color: "#5b21b6", padding: "7px 10px", cursor: "pointer", fontWeight: 600, fontSize: "11px" };
const form = { display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: "7px", marginTop: "12px", padding: "10px", background: "#f8fafc", borderRadius: "8px" };
const input = { minWidth: 0, border: "1px solid #d1d5db", borderRadius: "7px", padding: "8px", fontSize: "11px", background: "white" };
const primaryButton = { border: "none", borderRadius: "7px", background: "#2d1b69", color: "white", padding: "8px 10px", cursor: "pointer", fontWeight: 700, fontSize: "11px" };
const statusSelect = { border: "1px solid #d1d5db", borderRadius: "6px", padding: "5px 6px", fontSize: "11px", background: "white" };
const list = { marginTop: "10px" };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f1f5f9" };
const small = { display: "block", color: "#6b7280", fontSize: "11px", marginTop: "3px" };
const info = { marginTop: "10px" };
const infoRow = { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f1f5f9", fontSize: "12px", color: "#6b7280" };
const muted = { marginTop: "14px", color: "#6b7280", fontSize: "12px" };
const empty = { background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px" };
const errorBox = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "10px", fontSize: "12px" };
const statusStyle = (status: string) => ({ background: ["ativa", "aprovado", "concluido", "entregue"].includes(status) ? "#dcfce7" : ["cancelada", "reprovado"].includes(status) ? "#fee2e2" : "#fef9c3", color: ["ativa", "aprovado", "concluido", "entregue"].includes(status) ? "#166534" : ["cancelada", "reprovado"].includes(status) ? "#991b1b" : "#854d0e", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" as const });
