"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AppLayout from "@/components/AppLayout";

export default function DashboardPage() {
  const [creators, setCreators] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const user = session.user;

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("usuario_id", user.id)
        .single();

      const { data } = await supabase
        .from("creators")
        .select("*")
        .eq("empresa_id", usuario?.empresa_id);

      setCreators(data || []);
    };

    setTimeout(loadData, 300);
  }, []);

  // métricas dinâmicas
  const total = creators.length;
  const aprovados = creators.filter(c => c.status === "aprovado").length;
  const analise = creators.filter(c => c.status === "em_analise").length;
  const reprovados = creators.filter(c => c.status === "reprovado").length;

  return (
    <AppLayout>
      <div style={{ background: "#f5f5f6" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "11px", color: "#94a3b8" }}>
            Visão geral da sua operação com creators
          </p>
        </div>

        {/* CARDS */}
        <div style={grid6}>
          <Card label="Total Creators" value={total} />
          <Card label="Aprovados" value={aprovados} />
          <Card label="Em Análise" value={analise} />
          <Card label="Reprovados" value={reprovados} />
          <Card label="Receita Gerada" value="—" />
          <Card label="ROI Médio" value="—" />
        </div>

        {/* TOP CREATORS */}
        <div style={{ ...panelStyle, marginTop: 12 }}>
          <div style={panelTitle}>Top Creators</div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {creators.slice(0, 5).map((c) => (
              <div
                key={c.creator_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                }}
              >
                <span>{c.nome || "Sem nome"}</span>
                <span style={{ color: "#0f766e" }}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Card({ label, value }: any) {
  return (
    <div style={miniCard}>
      <div style={miniLabel}>{label}</div>
      <div style={miniValue}>{value}</div>
    </div>
  );
}

const grid6 = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "10px",
};

const miniCard = {
  background: "white",
  borderRadius: "8px",
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
};

const miniLabel = {
  fontSize: "10px",
  color: "#94a3b8",
  marginBottom: "6px",
};

const miniValue = {
  fontSize: "14px",
  fontWeight: 700,
};

const panelStyle = {
  background: "white",
  borderRadius: "8px",
  padding: "12px",
  border: "1px solid #e5e7eb",
};

const panelTitle = {
  fontSize: "12px",
  fontWeight: 600,
};