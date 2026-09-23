"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lesson = { aula_id: string; titulo: string; descricao: string | null; ordem: number; duracao_min: number; ativo: boolean };

export default function AcademyLessonsAdminPage() {
  const params = useSearchParams();
  const trackId = params.get("id");
  const [title, setTitle] = useState("Trilha");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("10");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!trackId) return;
    const [{ data: track }, { data: items }] = await Promise.all([
      supabase.from("academy_trilhas").select("titulo").eq("trilha_id", trackId).maybeSingle(),
      supabase.from("academy_aulas").select("aula_id, titulo, descricao, ordem, duracao_min, ativo").eq("trilha_id", trackId).order("ordem"),
    ]);
    if (track) setTitle(track.titulo);
    setLessons(items || []);
  };
  useEffect(() => { void load(); }, [trackId]);

  const addLesson = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    if (!trackId || !lessonTitle.trim()) { setMessage("Informe o título da aula."); return; }
    const nextOrder = lessons.reduce((max, item) => Math.max(max, item.ordem), 0) + 1;
    const { error } = await supabase.from("academy_aulas").insert({ trilha_id: trackId, titulo: lessonTitle.trim(), descricao: description.trim() || null, ordem: nextOrder, duracao_min: Math.max(0, Number(duration) || 0) });
    if (error) { setMessage("Não foi possível salvar. Confirme a migration 12 e a permissão do seu perfil."); return; }
    setLessonTitle(""); setDescription(""); setDuration("10"); setMessage("Aula adicionada."); await load();
  };

  const removeLesson = async (lesson: Lesson) => {
    if (!window.confirm(`Excluir a aula “${lesson.titulo}”?`)) return;
    const { error } = await supabase.from("academy_aulas").delete().eq("aula_id", lesson.aula_id);
    if (error) { setMessage("Não foi possível excluir a aula."); return; }
    await load();
  };

  return <div>
    <Link href="/academy/admin" style={back}>← Voltar para trilhas</Link>
    <h1 style={titleStyle}>Aulas: {title}</h1><p style={subtitle}>Organize o conteúdo que será apresentado aos creators.</p>
    {message && <div style={notice}>{message}</div>}
    <form onSubmit={addLesson} style={form}>
      <input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Título da aula" style={input} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" style={input} />
      <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Minutos" style={input} />
      <button type="submit" style={button}>Adicionar aula</button>
    </form>
    <div style={list}>{lessons.length === 0 ? <div style={empty}>Nenhuma aula cadastrada nesta trilha.</div> : lessons.map((lesson) => <div key={lesson.aula_id} style={card}><div style={number}>{lesson.ordem}</div><div style={content}><strong>{lesson.titulo}</strong>{lesson.descricao && <div style={meta}>{lesson.descricao}</div>}<div style={meta}>{lesson.duracao_min} min</div></div><button type="button" onClick={() => void removeLesson(lesson)} style={deleteButton}>Excluir</button></div>)}</div>
  </div>;
}

const back = { display: "inline-block", marginBottom: "16px", color: "#0f766e", fontSize: "12px", textDecoration: "none" };
const titleStyle = { margin: 0, fontSize: "22px", fontWeight: 700 };
const subtitle = { color: "#6b7280", fontSize: "13px", margin: "6px 0 18px" };
const notice = { background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", marginBottom: "14px" };
const form = { display: "grid", gridTemplateColumns: "2fr 2fr 100px auto", gap: "8px", marginBottom: "18px" };
const input = { border: "1px solid #d1d5db", borderRadius: "7px", padding: "9px 10px", fontSize: "12px", background: "white" };
const button = { border: 0, borderRadius: "7px", padding: "9px 14px", background: "#0f766e", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" };
const list = { display: "grid", gap: "8px", maxWidth: "760px" };
const card = { display: "flex", alignItems: "center", gap: "12px", background: "white", border: "1px solid #e5e7eb", borderRadius: "9px", padding: "12px 14px", fontSize: "13px" };
const number = { width: "26px", height: "26px", display: "grid", placeItems: "center", borderRadius: "50%", background: "#ecfeff", color: "#0f766e", fontWeight: 700, fontSize: "12px" };
const content = { flex: 1 };
const meta = { color: "#6b7280", fontSize: "11px", marginTop: "4px" };
const deleteButton = { border: "1px solid #fecaca", color: "#b91c1c", background: "white", borderRadius: "6px", padding: "6px 9px", fontSize: "11px", cursor: "pointer" };
const empty = { background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px" };
