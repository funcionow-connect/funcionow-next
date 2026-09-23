"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AcademyPage() {
  const trilhasDemo = [
    {
      titulo: "Fundamentos do Marketing de Influência",
      nivel: "Iniciante",
      aulas: 8,
      duracao: "40 min",
      categoria: "Marketing",
      concluidas: 5,
    },
    {
      titulo: "Criação de Conteúdo para Redes Sociais",
      nivel: "Intermediário",
      aulas: 12,
      duracao: "45 min",
      categoria: "Conteúdo",
      concluidas: 8,
    },
    {
      titulo: "Análise de Métricas e Performance",
      nivel: "Avançado",
      aulas: 6,
      duracao: "35 min",
      categoria: "Analytics",
      concluidas: 2,
    },
    {
      titulo: "Storytelling para Marcas",
      nivel: "Intermediário",
      aulas: 10,
      duracao: "50 min",
      categoria: "Conteúdo",
      concluidas: 0,
    },
    {
      titulo: "Negociação com Creators",
      nivel: "Avançado",
      aulas: 5,
      duracao: "20 min",
      categoria: "Gestão",
      concluidas: 5,
    },
  ];

  const [trilhas, setTrilhas] = useState(trilhasDemo);
  const [dataSource, setDataSource] = useState<"demo" | "supabase">("demo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAcademy = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("usuario_id", session.user.id).maybeSingle();
        const trackQuery = supabase.from("academy_trilhas").select("trilha_id, titulo, nivel, categoria").eq("ativo", true).order("titulo");
        const { data: trackData, error: trackError } = usuario?.empresa_id
          ? await trackQuery.or(`empresa_id.is.null,empresa_id.eq.${usuario.empresa_id}`)
          : await trackQuery.is("empresa_id", null);
        if (trackError || !trackData?.length) return;
        const ids = trackData.map((item) => item.trilha_id);
        const [{ data: lessons }, { data: progress }] = await Promise.all([
          supabase.from("academy_aulas").select("aula_id, trilha_id, duracao_min").in("trilha_id", ids).eq("ativo", true),
          supabase.from("academy_progresso").select("aula_id").eq("usuario_id", session.user.id),
        ]);
        const done = new Set((progress || []).map((item) => item.aula_id));
        const mapped = trackData.map((track) => {
          const trackLessons = (lessons || []).filter((lesson) => lesson.trilha_id === track.trilha_id);
          const totalMinutes = trackLessons.reduce((sum, lesson) => sum + (lesson.duracao_min || 0), 0);
          return {
            trilhaId: track.trilha_id,
            titulo: track.titulo,
            nivel: track.nivel === "intermediario" ? "Intermediário" : track.nivel === "avancado" ? "Avançado" : "Iniciante",
            aulas: trackLessons.length,
            duracao: `${totalMinutes} min`,
            categoria: track.categoria,
            concluidas: trackLessons.filter((lesson) => done.has(lesson.aula_id)).length,
          };
        });
        setTrilhas(mapped);
        setDataSource("supabase");
      } finally {
        setLoading(false);
      }
    };
    void loadAcademy();
  }, []);

  const [search, setSearch] = useState("");
  const [nivel, setNivel] = useState("Todos");
  const [categoria, setCategoria] = useState("Todas");
  const categorias = Array.from(new Set(trilhas.map((item) => item.categoria)));
  const trilhasFiltradas = useMemo(() => trilhas.filter((item) => {
    const termo = search.trim().toLowerCase();
    return (!termo || item.titulo.toLowerCase().includes(termo) || item.categoria.toLowerCase().includes(termo)) && (nivel === "Todos" || item.nivel === nivel) && (categoria === "Todas" || item.categoria === categoria);
  }), [search, nivel, categoria]);
  const aulasConcluidas = trilhas.reduce((sum, item) => sum + item.concluidas, 0);
  const aulasTotais = trilhas.reduce((sum, item) => sum + item.aulas, 0);

  return (
    
      <div>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={title}>Academy</h1>
          <p style={subtitle}>Trilhas de treinamento para desenvolver creators</p>
          <Link href="/academy/admin" style={adminLink}>Gerenciar conteúdo</Link>
        </div>

        {dataSource === "demo" && !loading && <div style={notice}>Exibindo conteúdo demonstrativo. Execute a migration <strong>12_academy.sql</strong> no Supabase para carregar trilhas reais.</div>}

        <div style={summaryGrid}>
          <div style={summaryCard}><span>Trilhas disponíveis</span><strong>{trilhas.length}</strong></div>
          <div style={summaryCard}><span>Aulas concluídas</span><strong>{aulasConcluidas}/{aulasTotais}</strong></div>
          <div style={summaryCard}><span>Progresso geral</span><strong>{aulasTotais ? Math.round((aulasConcluidas / aulasTotais) * 100) : 0}%</strong></div>
        </div>

        <div style={filters}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar trilha" style={input} />
          <select value={nivel} onChange={(event) => setNivel(event.target.value)} style={input}><option>Todos</option><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select>
          <select value={categoria} onChange={(event) => setCategoria(event.target.value)} style={input}><option>Todas</option>{categorias.map((item) => <option key={item}>{item}</option>)}</select>
          <span style={count}>{trilhasFiltradas.length} trilha(s)</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {trilhasFiltradas.map((t) => {
            const pct = Math.round((t.concluidas / t.aulas) * 100);

            return (
              <div key={t.titulo} style={card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={iconBox}>📖</div>
                  <span style={badgeStyle(t.nivel)}>{t.nivel}</span>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "8px",
                    lineHeight: 1.4,
                  }}
                >
                  {t.titulo}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    fontSize: "11px",
                    color: "#6b7280",
                    marginBottom: "14px",
                  }}
                >
                  <span>{t.aulas} aulas</span>
                  <span>{t.duracao}</span>
                  <span style={categoryBadge}>{t.categoria}</span>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>
                      {t.concluidas}/{t.aulas} concluídas
                    </span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>
                      {pct}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "#e5e7eb",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "#0f766e",
                        borderRadius: "999px",
                      }}
                    />
                  </div>

                  {pct === 100 && (
                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "11px",
                        color: "#16a34a",
                        fontWeight: 500,
                      }}
                    >
                      ✓ Trilha concluída
                    </div>
                  )}
                  {"trilhaId" in t && t.trilhaId ? <Link href={`/academy/trilha?id=${t.trilhaId}`} style={openLink}>Abrir trilha →</Link> : <span style={disabledLink}>Disponível após configurar o conteúdo</span>}
                </div>
              </div>
            );
          })}
          {trilhasFiltradas.length === 0 && <div style={empty}>Nenhuma trilha corresponde aos filtros.</div>}
        </div>
      </div>
    
  );
}

function badgeStyle(nivel: string) {
  if (nivel === "Iniciante") {
    return {
      background: "#dcfce7",
      color: "#166534",
      fontSize: "10px",
      padding: "3px 8px",
      borderRadius: "999px",
      fontWeight: 600,
    };
  }

  if (nivel === "Intermediário") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      fontSize: "10px",
      padding: "3px 8px",
      borderRadius: "999px",
      fontWeight: 600,
    };
  }

  return {
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "10px",
    padding: "3px 8px",
    borderRadius: "999px",
    fontWeight: 600,
  };
}

const title = {
  fontSize: "22px",
  fontWeight: 700,
  margin: 0,
};

const subtitle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "14px",
};

const iconBox = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "#ecfeff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
};

const categoryBadge = {
  background: "#f3f4f6",
  color: "#374151",
  padding: "2px 6px",
  borderRadius: "999px",
  fontSize: "10px",
};

const summaryGrid = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "14px" };
const summaryCard = { display: "grid", gap: "5px", background: "white", border: "1px solid #e5e7eb", borderRadius: "9px", padding: "11px", color: "#6b7280", fontSize: "11px" };
const summaryValue = { fontSize: "18px", color: "#111827" };
const filters = { display: "grid", gridTemplateColumns: "minmax(200px, 2fr) 1fr 1fr auto", gap: "8px", alignItems: "center", marginBottom: "14px" };
const input = { border: "1px solid #d1d5db", borderRadius: "7px", padding: "9px 10px", fontSize: "12px", background: "white" };
const count = { color: "#6b7280", fontSize: "11px" };
const empty = { gridColumn: "1 / -1", background: "white", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "28px", textAlign: "center" as const, color: "#6b7280", fontSize: "13px" };
const notice = { background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", marginBottom: "14px" };
const openLink = { display: "inline-block", marginTop: "12px", color: "#0f766e", fontSize: "12px", fontWeight: 600, textDecoration: "none" };
const disabledLink = { display: "block", marginTop: "12px", color: "#9ca3af", fontSize: "11px" };
const adminLink = { display: "inline-block", marginTop: "8px", color: "#0f766e", fontSize: "12px", fontWeight: 600, textDecoration: "none" };
