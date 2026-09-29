"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RankingItem = { pos: number; nome: string; user: string; pontos: number; emoji: string };
type Meta = { nome: string; pct: number };
type Badge = { nome: string; desc: string; icon: string; active: boolean };

export default function RewardsPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rewardMessage, setRewardMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setError("Faça login para visualizar suas recompensas."); setLoading(false); return; }
      const { data: user } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle<{ empresa_id: string }>();
      if (!user?.empresa_id) { setError("Não foi possível identificar a empresa."); setLoading(false); return; }
      const [{ data: creators }, { data: campaigns }, { count: progressCount }, { count: postCount }] = await Promise.all([
        supabase.from("creators").select("nome, instagram, score_total").eq("empresa_id", user.empresa_id).eq("status", "aprovado").order("score_total", { ascending: false, nullsFirst: false }).limit(10),
        supabase.from("campanhas").select("campanha_id").eq("empresa_id", user.empresa_id),
        supabase.from("academy_progresso").select("progresso_id", { count: "exact", head: true }).eq("usuario_id", session.user.id),
        supabase.from("community_posts").select("post_id", { count: "exact", head: true }).eq("usuario_id", session.user.id),
      ]);
      const rankingData = creators || [];
      const scores = rankingData.map((item) => Number(item.score_total || 0));
      const averageScore = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      setRanking(rankingData.map((item, index) => ({ pos: index + 1, nome: item.nome, user: item.instagram || "Creator", pontos: Math.round(Number(item.score_total || 0)), emoji: index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤" })));
      let completedDeliverables = 0; let totalDeliverables = 0;
      if (campaigns?.length) { const { data: deliverables } = await supabase.from("campanha_entregaveis").select("status").in("campanha_id", campaigns.map((item) => item.campanha_id)); totalDeliverables = deliverables?.length || 0; completedDeliverables = (deliverables || []).filter((item) => ["entregue", "aprovado"].includes(item.status)).length; }
      const { count: totalLessons } = await supabase.from("academy_aulas").select("aula_id", { count: "exact", head: true }).eq("ativo", true);
      const progressPct = totalLessons ? Math.min(100, Math.round(((progressCount || 0) / totalLessons) * 100)) : 0;
      setMetas([
        { nome: "Atingir 5 entregáveis concluídos", pct: Math.min(100, Math.round((completedDeliverables / 5) * 100)) },
        { nome: "Manter score médio dos creators acima de 7", pct: Math.min(100, Math.round((averageScore / 7) * 100)) },
        { nome: "Completar trilhas da academia", pct: progressPct },
      ]);
      setBadges([
        { nome: "Primeira publicação", desc: "Publicou na Comunidade", icon: "🏆", active: (postCount || 0) > 0 },
        { nome: "Score alto", desc: "Score médio acima de 7", icon: "🔥", active: averageScore >= 7 },
        { nome: "Top Creator", desc: "Ficou no top 3 do ranking", icon: "⭐", active: rankingData.length >= 3 },
        { nome: "Campanha completa", desc: "Concluiu todos os entregáveis", icon: "💎", active: totalDeliverables > 0 && completedDeliverables === totalDeliverables },
        { nome: "Mentor", desc: "Compartilhou 3 publicações", icon: "🪨", active: (postCount || 0) >= 3 },
        { nome: "Viral", desc: "Disponível quando houver métricas de alcance", icon: "🕊️", active: false },
      ]);
      setLoading(false);
    };
    void load();
  }, []);

  const metasConcluidas = metas.filter((meta) => meta.pct >= 100).length;
  const spin = async () => {
    if (metasConcluidas < metas.length) { setRewardMessage("Complete todas as metas para girar a roda."); return; }
    const rewards = ["Consultoria de conteúdo", "Destaque na Comunidade", "Bônus de campanha"];
    const prize = rewards[Math.floor(Math.random() * rewards.length)];
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) { const { data: user } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle<{ empresa_id: string }>(); if (user?.empresa_id) await supabase.from("reward_events").insert({ empresa_id: user.empresa_id, usuario_id: session.user.id, tipo: "premio", codigo: prize.toLowerCase().replaceAll(" ", "_"), descricao: prize }); }
    setRewardMessage(`Prêmio sorteado: ${prize}`);
  };

  return <div><div style={{ marginBottom: "16px" }}><h1 style={title}>Recompensas</h1><p style={subtitle}>Metas e reconhecimento baseados na atividade real da empresa.</p></div>{error && <div style={notice}>{error}</div>}{loading ? <div style={empty}>Carregando dados reais...</div> : <><div style={grid}><div style={card}><div style={sectionTitle}>🏆 Ranking</div>{ranking.length ? <div style={list}>{ranking.map((item) => <div key={item.pos} style={rankRow}><div style={person}><div style={posCircle(item.pos)}>{item.pos}</div><div style={avatarBox}>{item.emoji}</div><div><div style={nameStyle}>{item.nome}</div><div style={userStyle}>{item.user}</div></div></div><div style={pointsStyle}>{item.pontos} pts</div></div>)}</div> : <div style={emptySmall}>Ainda não há creators aprovados com score para formar o ranking.</div>}</div><div style={{ display: "grid", gap: "12px" }}><div style={card}><div style={sectionTitle}>🎯 Metas</div><div style={metaList}>{metas.map((meta) => <div key={meta.nome}><div style={metaHeader}><span>{meta.nome}</span><span>{meta.pct}%</span></div><div style={progressBg}><div style={{ ...progressFill, width: `${meta.pct}%` }} /></div></div>)}</div></div><div style={prizeCard}><div style={{ fontSize: "18px" }}>🎁</div><strong>Roda de prêmios</strong><span>Complete as metas reais para girar.</span><button type="button" onClick={spin} style={spinButton}>Girar roda</button>{rewardMessage && <small>{rewardMessage}</small>}</div></div></div><div style={card}><div style={sectionTitle}>🏅 Conquistas</div><div style={badgesGrid}>{badges.map((badge) => <div key={badge.nome} style={badgeCard(badge.active)}><div style={{ fontSize: "18px", opacity: badge.active ? 1 : 0.45 }}>{badge.icon}</div><div style={badgeName(badge.active)}>{badge.nome}</div><div style={badgeDesc(badge.active)}>{badge.desc}</div></div>)}</div></div></>}</div>;
}

const title = { fontSize: "22px", fontWeight: 700, margin: 0 };
const subtitle = { fontSize: "12px", color: "#6b7280", marginTop: "4px" };
const notice = { background: "#fff1f3", border: "1px solid #fecdd3", color: "#a0445d", borderRadius: "8px", padding: "9px 11px", fontSize: "11px", marginTop: "10px" };
const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px" };
const grid = { display: "grid", gridTemplateColumns: "2.1fr 1fr", gap: "12px", marginBottom: "12px" };
const sectionTitle = { fontSize: "12px", fontWeight: 700, color: "#111827" };
const list = { marginTop: "10px", display: "grid", gap: "8px" };
const rankRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 8px", borderRadius: "8px", background: "#fafaf9", border: "1px solid #f1f5f9" };
const person = { display: "flex", alignItems: "center", gap: "10px" };
const avatarBox = { width: "24px", height: "24px", borderRadius: "999px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" };
const nameStyle = { fontSize: "12px", fontWeight: 600, color: "#111827" };
const userStyle = { fontSize: "10px", color: "#94a3b8" };
const pointsStyle = { fontSize: "11px", fontWeight: 700, color: "#0f766e" };
const metaList = { marginTop: "10px", display: "grid", gap: "12px" };
const metaHeader = { display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px", color: "#374151" };
const progressBg = { height: "6px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden" };
const progressFill = { height: "100%", borderRadius: "999px", background: "#b8ff00" };
const prizeCard = { background: "linear-gradient(180deg, #f59e0b 0%, #f97316 100%)", borderRadius: "10px", padding: "18px 16px", color: "white", textAlign: "center" as const, display: "grid", gap: "6px" };
const spinButton = { border: 0, borderRadius: "7px", padding: "8px", background: "white", color: "#c2410c", fontWeight: 700, cursor: "pointer" };
const badgesGrid = { marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" };
const empty = { padding: "32px", border: "1px dashed #d8c9f2", borderRadius: "16px", textAlign: "center" as const, color: "#77737e", background: "#fbfaff" };
const emptySmall = { padding: "28px 12px", textAlign: "center" as const, color: "#77737e", fontSize: "12px" };
function posCircle(pos: number) { return { width: "18px", height: "18px", borderRadius: "999px", background: pos === 1 ? "#f59e0b" : pos === 2 ? "#d1d5db" : pos === 3 ? "#d6b38a" : "#e5e7eb", color: pos <= 3 ? "white" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }; }
function badgeCard(active: boolean) { return { padding: "10px 6px", textAlign: "center" as const, borderRadius: "8px", border: "1px solid #e5e7eb", background: active ? "#fffbeb" : "#f8fafc" }; }
function badgeName(active: boolean) { return { fontSize: "10px", fontWeight: 700, color: active ? "#92400e" : "#94a3b8" }; }
function badgeDesc(active: boolean) { return { fontSize: "9px", color: active ? "#a16207" : "#cbd5e1", marginTop: "3px" }; }
