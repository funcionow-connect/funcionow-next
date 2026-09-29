"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Speaker = { speaker_id: string; creator_id: string | null; nome: string; email: string | null; instagram: string | null; especialidade: string | null; percentual_comissao: number; ativo: boolean };
type Creator = { creator_id: string; nome: string; instagram: string; status: string | null };
type LinkRow = { speaker_creator_id: string; speaker_id: string; creator_id: string; percentual_comissao: number; ativo: boolean };

export default function SpeakersPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [speakerForm, setSpeakerForm] = useState({ nome: "", email: "", instagram: "", especialidade: "", percentual: "", creatorId: "" });
  const [creatorId, setCreatorId] = useState("");
  const [creatorPercentual, setCreatorPercentual] = useState("");
  const selected = speakers.find((speaker) => speaker.speaker_id === selectedSpeaker) || null;
  const assignedCreatorIds = useMemo(() => new Set(links.filter((link) => link.ativo).map((link) => link.creator_id)), [links]);
  const availableCreators = creators.filter((creator) => !assignedCreatorIds.has(creator.creator_id));
  const selectedLinks = links.filter((link) => link.speaker_id === selectedSpeaker && link.ativo);

  const load = async () => {
    setLoading(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setError("Faça login para acessar a rede de speakers."); setLoading(false); return; }
    const { data: usuario, error: userError } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle<{ empresa_id: string }>();
    if (userError || !usuario?.empresa_id) { setError("Não foi possível identificar a empresa."); setLoading(false); return; }
    setEmpresaId(usuario.empresa_id);
    const [speakerRes, creatorRes, linkRes] = await Promise.all([
      supabase.from("speakers").select("speaker_id, creator_id, nome, email, instagram, especialidade, percentual_comissao, ativo").eq("empresa_id", usuario.empresa_id).eq("ativo", true).order("nome"),
      supabase.from("creators").select("creator_id, nome, instagram, status").eq("empresa_id", usuario.empresa_id).order("nome"),
      supabase.from("speaker_creators").select("speaker_creator_id, speaker_id, creator_id, percentual_comissao, ativo").eq("empresa_id", usuario.empresa_id).eq("ativo", true),
    ]);
    if (speakerRes.error || creatorRes.error || linkRes.error) setError("Execute as migrations 15_speakers_rede.sql e 16_speaker_creator_promotion.sql no Supabase para habilitar este módulo.");
    const nextSpeakers = (speakerRes.data || []) as Speaker[];
    setSpeakers(nextSpeakers); setCreators((creatorRes.data || []) as Creator[]); setLinks((linkRes.data || []) as LinkRow[]);
    if (!selectedSpeaker && nextSpeakers[0]) setSelectedSpeaker(nextSpeakers[0].speaker_id);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const addSpeaker = async (event: FormEvent) => {
    event.preventDefault(); if (!empresaId || !speakerForm.nome.trim()) return;
    setSaving(true); setError("");
    const { data, error: insertError } = await supabase.from("speakers").insert({ empresa_id: empresaId, creator_id: speakerForm.creatorId || null, nome: speakerForm.nome.trim(), email: speakerForm.email.trim() || null, instagram: speakerForm.instagram.trim() || null, especialidade: speakerForm.especialidade.trim() || null, percentual_comissao: Number(speakerForm.percentual) || 0 }).select("speaker_id, creator_id, nome, email, instagram, especialidade, percentual_comissao, ativo").single();
    if (insertError) setError(insertError.code === "23505" ? "Este creator já foi promovido a speaker." : insertError.message); else { const speaker = data as Speaker; setSpeakers((current) => [...current, speaker].sort((a, b) => a.nome.localeCompare(b.nome))); setSelectedSpeaker(speaker.speaker_id); setSpeakerForm({ nome: "", email: "", instagram: "", especialidade: "", percentual: "", creatorId: "" }); }
    setSaving(false);
  };

  const assignCreator = async (event: FormEvent) => {
    event.preventDefault(); if (!empresaId || !selectedSpeaker || !creatorId) return;
    setSaving(true); setError("");
    const { data, error: insertError } = await supabase.from("speaker_creators").insert({ empresa_id: empresaId, speaker_id: selectedSpeaker, creator_id: creatorId, percentual_comissao: Number(creatorPercentual) || 0 }).select("speaker_creator_id, speaker_id, creator_id, percentual_comissao, ativo").single();
    if (insertError) setError(insertError.code === "23505" ? "Este creator já está vinculado a um speaker." : insertError.message); else { setLinks((current) => [...current, data as LinkRow]); setCreatorId(""); setCreatorPercentual(""); }
    setSaving(false);
  };

  const removeCreator = async (link: LinkRow) => {
    const { error: updateError } = await supabase.from("speaker_creators").update({ ativo: false }).eq("speaker_creator_id", link.speaker_creator_id);
    if (updateError) setError(updateError.message); else setLinks((current) => current.filter((item) => item.speaker_creator_id !== link.speaker_creator_id));
  };
  const creatorName = (id: string) => creators.find((creator) => creator.creator_id === id)?.nome || "Creator";

  return <div style={page}>
    <div style={header}><div><div style={eyebrow}>REDE DE INFLUÊNCIA</div><h1 style={title}>Speakers e creators</h1><p style={subtitle}>Desenvolva uma rede de creators e acompanhe a regra de comissão de cada responsável.</p></div><Link href="/creators" style={secondaryButton}>Ver creators</Link></div>
    {error && <div style={alert}>{error}</div>}
    {loading ? <div style={empty}>Carregando rede...</div> : <div style={layout}>
      <section style={card}><div style={cardHeader}><div><h2 style={cardTitle}>Speakers responsáveis</h2><p style={muted}>{speakers.length} cadastrados</p></div></div>
        {speakers.length === 0 ? <div style={emptySmall}>Cadastre o primeiro speaker para começar a rede.</div> : <div style={speakerList}>{speakers.map((speaker) => <button key={speaker.speaker_id} type="button" onClick={() => setSelectedSpeaker(speaker.speaker_id)} style={{ ...speakerItem, ...(speaker.speaker_id === selectedSpeaker ? selectedItem : {}) }}><span style={avatar}>{speaker.nome.slice(0, 1).toUpperCase()}</span><span style={speakerText}><strong>{speaker.nome}</strong><small>{speaker.especialidade || "Sem especialidade"}</small></span><span style={commission}>{Number(speaker.percentual_comissao).toFixed(1)}%</span></button>)}</div>}
        <form onSubmit={addSpeaker} style={form}><h3 style={formTitle}>Adicionar ou promover creator</h3><select value={speakerForm.creatorId} onChange={(e) => { const creator = creators.find((item) => item.creator_id === e.target.value); setSpeakerForm({ ...speakerForm, creatorId: e.target.value, nome: creator?.nome || speakerForm.nome, instagram: creator?.instagram || speakerForm.instagram }); }} style={input}><option value="">Speaker novo, sem creator</option>{creators.filter((creator) => !speakers.some((speaker) => speaker.creator_id === creator.creator_id)).map((creator) => <option key={creator.creator_id} value={creator.creator_id}>Promover {creator.nome}</option>)}</select><input required value={speakerForm.nome} onChange={(e) => setSpeakerForm({ ...speakerForm, nome: e.target.value })} placeholder="Nome completo" style={input} /><div style={twoCols}><input value={speakerForm.email} onChange={(e) => setSpeakerForm({ ...speakerForm, email: e.target.value })} placeholder="E-mail" type="email" style={input} /><input value={speakerForm.instagram} onChange={(e) => setSpeakerForm({ ...speakerForm, instagram: e.target.value })} placeholder="Instagram" style={input} /></div><div style={twoCols}><input value={speakerForm.especialidade} onChange={(e) => setSpeakerForm({ ...speakerForm, especialidade: e.target.value })} placeholder="Especialidade" style={input} /><input value={speakerForm.percentual} onChange={(e) => setSpeakerForm({ ...speakerForm, percentual: e.target.value })} placeholder="Comissão (%)" type="number" min="0" max="100" step="0.1" style={input} /></div><button disabled={saving} style={primaryButton}>{saving ? "Salvando..." : speakerForm.creatorId ? "Promover a speaker" : "Cadastrar speaker"}</button></form>
      </section>
      <section style={card}><div style={cardHeader}><div><h2 style={cardTitle}>{selected ? selected.nome : "Selecione um speaker"}</h2><p style={muted}>{selected ? `${selectedLinks.length} creators na rede · comissão padrão ${Number(selected.percentual_comissao).toFixed(1)}%` : "Escolha um speaker para visualizar a rede."}</p></div></div>
        {!selected ? <div style={empty}>Nenhum speaker selecionado.</div> : <><div style={networkList}>{selectedLinks.length === 0 ? <div style={emptySmall}>Nenhum creator vinculado a este speaker.</div> : selectedLinks.map((link) => <div key={link.speaker_creator_id} style={networkItem}><div><strong>{creatorName(link.creator_id)}</strong><small>{creators.find((creator) => creator.creator_id === link.creator_id)?.instagram || "Sem Instagram"}</small></div><div style={networkActions}><span style={commission}>{Number(link.percentual_comissao).toFixed(1)}%</span><button type="button" onClick={() => void removeCreator(link)} style={removeButton}>Remover</button></div></div>)}</div><form onSubmit={assignCreator} style={assignForm}><h3 style={formTitle}>Vincular creator</h3><div style={twoCols}><select required value={creatorId} onChange={(e) => setCreatorId(e.target.value)} style={input}><option value="">Escolha um creator</option>{availableCreators.map((creator) => <option key={creator.creator_id} value={creator.creator_id}>{creator.nome}</option>)}</select><input value={creatorPercentual} onChange={(e) => setCreatorPercentual(e.target.value)} placeholder="Comissão do creator (%)" type="number" min="0" max="100" step="0.1" style={input} /></div><button disabled={saving || !availableCreators.length} style={primaryButton}>{availableCreators.length ? "Vincular à rede" : "Todos os creators já estão vinculados"}</button></form></>}
      </section>
    </div>}
    <div style={note}><strong>Próxima etapa:</strong> ligar cada venda a um creator, cupom ou UTM para calcular automaticamente a comissão do speaker e o resultado da rede.</div>
  </div>;
}

const page = { padding: "8px 0 32px" } as const;
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 24 } as const;
const eyebrow = { color: "#7654c7", fontSize: 12, fontWeight: 800, letterSpacing: "0.12em" } as const;
const title = { margin: "6px 0 8px", color: "#29272d", fontSize: 32, letterSpacing: "-0.04em" } as const;
const subtitle = { margin: 0, color: "#77737e", maxWidth: 650 } as const;
const layout = { display: "grid", gridTemplateColumns: "minmax(300px, 0.8fr) minmax(360px, 1.2fr)", gap: 20, alignItems: "start" } as const;
const card = { background: "#fff", border: "1px solid #e7e1f1", borderRadius: 20, padding: 22, boxShadow: "0 12px 30px rgba(66, 46, 96, 0.06)" } as const;
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 } as const;
const cardTitle = { margin: 0, color: "#29272d", fontSize: 20 } as const;
const muted = { margin: "5px 0 0", color: "#77737e", fontSize: 13 } as const;
const speakerList = { display: "grid", gap: 8 } as const;
const speakerItem = { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 10px", border: "1px solid transparent", borderRadius: 14, background: "#faf9fd", textAlign: "left" as const, cursor: "pointer" };
const selectedItem = { borderColor: "#b58cff", background: "#f3efff" } as const;
const avatar = { display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 12, background: "#b8ff00", color: "#29272d", fontWeight: 800 } as const;
const speakerText = { display: "grid", gap: 2, flex: 1 } as const;
const commission = { color: "#7654c7", fontWeight: 800, fontSize: 13 } as const;
const form = { display: "grid", gap: 10, marginTop: 22, paddingTop: 20, borderTop: "1px solid #eeeaf5" } as const;
const assignForm = { display: "grid", gap: 10, marginTop: 22, paddingTop: 20, borderTop: "1px solid #eeeaf5" } as const;
const formTitle = { margin: 0, fontSize: 15, color: "#29272d" } as const;
const twoCols = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } as const;
const input = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #ddd5eb", borderRadius: 12, padding: "11px 12px", background: "#fff", color: "#29272d", fontSize: 14 } as const;
const primaryButton = { border: 0, borderRadius: 12, padding: "12px 16px", background: "#b8ff00", color: "#29272d", fontWeight: 800, cursor: "pointer" } as const;
const secondaryButton = { display: "inline-flex", alignItems: "center", border: "1px solid #d8c9f2", borderRadius: 12, padding: "10px 14px", color: "#7654c7", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" } as const;
const networkList = { display: "grid", gap: 8 } as const;
const networkItem = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 12px", borderRadius: 14, background: "#faf9fd" } as const;
const networkActions = { display: "flex", alignItems: "center", gap: 12 } as const;
const removeButton = { border: 0, background: "transparent", color: "#a0445d", cursor: "pointer", fontSize: 12 } as const;
const empty = { padding: 32, border: "1px dashed #d8c9f2", borderRadius: 16, textAlign: "center" as const, color: "#77737e", background: "#fbfaff" };
const emptySmall = { padding: 20, textAlign: "center" as const, color: "#77737e", fontSize: 14 };
const alert = { marginBottom: 18, borderRadius: 12, padding: "12px 14px", background: "#fff1f3", color: "#a0445d", fontSize: 14 };
const note = { marginTop: 20, padding: "14px 16px", borderRadius: 14, background: "#f3efff", color: "#5c4a79", fontSize: 14 };
