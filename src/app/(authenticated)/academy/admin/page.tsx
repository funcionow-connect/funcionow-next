"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Track = { trilha_id: string; titulo: string; descricao: string | null; nivel: string; categoria: string; ativo: boolean };

export default function AcademyAdminPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [level, setLevel] = useState("iniciante");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await supabase.from("academy_trilhas").select("trilha_id, titulo, descricao, nivel, categoria, ativo").order("titulo");
    setTracks(data || []); setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const createTrack = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    if (!title.trim()) { setMessage("Informe o título da trilha."); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setMessage("Faça login para cadastrar uma trilha."); return; }
    const { data: user } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle();
    if (!user?.empresa_id) { setMessage("Não foi possível identificar a empresa."); return; }
    const { error } = await supabase.from("academy_trilhas").insert({ empresa_id: user.empresa_id, titulo: title.trim(), descricao: description.trim() || null, nivel: level, categoria: category.trim() || "geral" });
    if (error) { setMessage("Não foi possível salvar. Verifique se seu perfil tem permissão e se a migration 12 foi executada."); return; }
    setTitle(""); setDescription(""); setMessage("Trilha criada."); await load();
  };

  return <div>
    <Link href="/academy" style={back}>← Voltar para Academy</Link>
    <h1 style={titleStyle}>Gerenciar Academy</h1><p style={subtitle}>Cadastre trilhas para sua equipe e depois adicione as aulas.</p>
    {message && <div style={notice}>{message}</div>}
    <form onSubmit={createTrack} style={form}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da trilha" style={input} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" style={input} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" style={input} />
      <select value={level} onChange={(e) => setLevel(e.target.value)} style={input}><option value="iniciante">Iniciante</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option></select>
      <button type="submit" style={button}>Criar trilha</button>
    </form>
    {loading ? <div style={empty}>Carregando...</div> : tracks.length === 0 ? <div style={empty}>Nenhuma trilha cadastrada.</div> : <div style={list}>{tracks.map((track) => <div key={track.trilha_id} style={card}><div><strong>{track.titulo}</strong><div style={meta}>{track.categoria} · {track.nivel}</div></div><div style={actions}><Link href={`/academy/admin/trilha?id=${track.trilha_id}`} style={manageLink}>Gerenciar aulas</Link><span style={track.ativo ? active : inactive}>{track.ativo ? "Ativa" : "Inativa"}</span></div></div>)}</div>}
  </div>;
}

const back = { display: "inline-block", marginBottom: "16px", color: "#0f766e", fontSize: "12px", textDecoration: "none" };
const titleStyle = { margin: 0, fontSize: "22px", fontWeight: 700 };
const subtitle = { color: "#6b7280", fontSize: "13px", margin: "6px 0 18px" };
const notice = { background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", marginBottom: "14px" };
const form = { display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr auto", gap: "8px", marginBottom: "18px" };
const input = { border: "1px solid #d1d5db", borderRadius: "7px", padding: "9px 10px", fontSize: "12px", background: "white" };
const button = { border: 0, borderRadius: "7px", padding: "9px 14px", background: "#0f766e", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" };
const list = { display: "grid", gap: "8px", maxWidth: "760px" };
const card = { display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", border: "1px solid #e5e7eb", borderRadius: "9px", padding: "12px 14px", fontSize: "13px" };
const meta = { color: "#6b7280", fontSize: "11px", marginTop: "4px" };
const active = { color: "#166534", background: "#dcfce7", borderRadius: "999px", padding: "3px 8px", fontSize: "10px" };
const inactive = { color: "#6b7280", background: "#f3f4f6", borderRadius: "999px", padding: "3px 8px", fontSize: "10px" };
const actions = { display: "flex", alignItems: "center", gap: "10px" };
const manageLink = { color: "#0f766e", fontSize: "11px", fontWeight: 600, textDecoration: "none" };
const empty = { background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px" };
