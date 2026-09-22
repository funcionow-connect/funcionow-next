"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
    <div style={{ ...card, marginTop: "14px" }}><div style={sectionTitle}>Entregáveis</div>{deliverables.length === 0 ? <div style={muted}>Nenhum entregável cadastrado.</div> : <div style={list}>{deliverables.map((item) => <div key={item.entregavel_id} style={row}><div><strong>{item.titulo}</strong><small style={small}>Prazo: {date(item.prazo)} · Custo: {money(item.custo)}</small></div><span style={statusStyle(item.status)}>{statusLabels[item.status] || item.status}</span></div>)}</div>}</div>
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
const list = { marginTop: "10px" };
const row = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f1f5f9" };
const small = { display: "block", color: "#6b7280", fontSize: "11px", marginTop: "3px" };
const info = { marginTop: "10px" };
const infoRow = { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f1f5f9", fontSize: "12px", color: "#6b7280" };
const muted = { marginTop: "14px", color: "#6b7280", fontSize: "12px" };
const empty = { background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px" };
const errorBox = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "10px", fontSize: "12px" };
const statusStyle = (status: string) => ({ background: ["ativa", "aprovado", "concluido", "entregue"].includes(status) ? "#dcfce7" : ["cancelada", "reprovado"].includes(status) ? "#fee2e2" : "#fef9c3", color: ["ativa", "aprovado", "concluido", "entregue"].includes(status) ? "#166534" : ["cancelada", "reprovado"].includes(status) ? "#991b1b" : "#854d0e", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" as const });
