"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lesson = { aula_id: string; titulo: string; descricao: string | null; ordem: number; duracao_min: number };

export default function AcademyTrackPage() {
  const params = useSearchParams();
  const trackId = params.get("id");
  const [title, setTitle] = useState("Trilha");
  const [description, setDescription] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!trackId) { setError("Trilha não informada."); setLoading(false); return; }
      const { data: track, error: trackError } = await supabase.from("academy_trilhas").select("titulo, descricao").eq("trilha_id", trackId).maybeSingle();
      const { data: lessonData, error: lessonError } = await supabase.from("academy_aulas").select("aula_id, titulo, descricao, ordem, duracao_min").eq("trilha_id", trackId).eq("ativo", true).order("ordem");
      const { data: { session } } = await supabase.auth.getSession();
      if (trackError || lessonError || !track) { setError("Não foi possível carregar esta trilha. Verifique se a migration 12_academy.sql foi executada."); setLoading(false); return; }
      setTitle(track.titulo); setDescription(track.descricao); setLessons(lessonData || []);
      if (session?.user && lessonData?.length) {
        const { data: progress } = await supabase.from("academy_progresso").select("aula_id").eq("usuario_id", session.user.id).in("aula_id", lessonData.map((item) => item.aula_id));
        setCompleted(new Set((progress || []).map((item) => item.aula_id)));
      }
      setLoading(false);
    };
    void load();
  }, [trackId]);

  const toggleLesson = async (lesson: Lesson) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const isDone = completed.has(lesson.aula_id);
    if (isDone) {
      await supabase.from("academy_progresso").delete().eq("usuario_id", session.user.id).eq("aula_id", lesson.aula_id);
      setCompleted((current) => { const next = new Set(current); next.delete(lesson.aula_id); return next; });
    } else {
      const { error: insertError } = await supabase.from("academy_progresso").insert({ usuario_id: session.user.id, aula_id: lesson.aula_id });
      if (insertError) { setError("Não foi possível salvar o progresso. Execute a migration 12_academy.sql."); return; }
      setCompleted((current) => new Set(current).add(lesson.aula_id));
    }
  };

  return <div>
    <Link href="/academy" style={back}>← Voltar para Academy</Link>
    <h1 style={titleStyle}>{title}</h1>
    {description && <p style={subtitle}>{description}</p>}
    {error && <div style={alert}>{error}</div>}
    {loading ? <div style={empty}>Carregando trilha...</div> : lessons.length === 0 ? <div style={empty}>Nenhuma aula cadastrada nesta trilha.</div> : <div style={list}>
      {lessons.map((lesson) => <div key={lesson.aula_id} style={lessonCard}>
        <div style={lessonHeader}><span style={order}>{lesson.ordem}</span><div><strong style={lessonTitle}>{lesson.titulo}</strong><div style={meta}>{lesson.duracao_min} min</div></div></div>
        {lesson.descricao && <p style={lessonDescription}>{lesson.descricao}</p>}
        <button type="button" onClick={() => void toggleLesson(lesson)} style={completed.has(lesson.aula_id) ? doneButton : actionButton}>{completed.has(lesson.aula_id) ? "✓ Concluída" : "Marcar como concluída"}</button>
      </div>)}
    </div>}
  </div>;
}

const back = { display: "inline-block", marginBottom: "16px", color: "#0f766e", fontSize: "12px", textDecoration: "none" };
const titleStyle = { margin: 0, fontSize: "22px", fontWeight: 700 };
const subtitle = { color: "#6b7280", fontSize: "13px", margin: "6px 0 18px" };
const alert = { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", margin: "14px 0" };
const empty = { background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px", marginTop: "16px" };
const list = { display: "grid", gap: "10px", maxWidth: "760px" };
const lessonCard = { background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px" };
const lessonHeader = { display: "flex", gap: "10px", alignItems: "center" };
const order = { width: "28px", height: "28px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#ecfeff", color: "#0f766e", fontWeight: 700, fontSize: "12px" };
const lessonTitle = { fontSize: "14px", color: "#111827" };
const meta = { fontSize: "11px", color: "#6b7280", marginTop: "3px" };
const lessonDescription = { color: "#4b5563", fontSize: "12px", margin: "12px 0" };
const actionButton = { border: "1px solid #0f766e", color: "#0f766e", background: "white", borderRadius: "7px", padding: "7px 10px", fontSize: "11px", cursor: "pointer" };
const doneButton = { ...actionButton, background: "#ecfdf5", borderColor: "#86efac", color: "#166534" };
