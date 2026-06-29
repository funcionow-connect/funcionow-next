"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("welcome=empresa")) {
      setShowWelcome(true);
      window.history.replaceState({}, "", "/dashboard");
    }

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

  const total = creators.length;
  const aprovados = creators.filter((c) => c.status === "aprovado").length;
  const analise = creators.filter((c) => c.status === "em_analise").length;
  const reprovados = creators.filter((c) => c.status === "reprovado").length;

  return (
          <div style={{ background: "#f5f5f6" }}>
        {showWelcome && (
          <div style={welcomeCard}>
            <div style={welcomeTop}>
              <div style={welcomeIcon}>✓</div>
              <button style={closeButton} onClick={() => setShowWelcome(false)}>
                Fechar
              </button>
            </div>

            <h2 style={welcomeTitle}>Bem-vindo ao Funcionow Connect</h2>
            <p style={welcomeText}>Sua empresa foi criada com sucesso.</p>

            <div style={stepsGrid}>
              <div style={stepCard}>Completar perfil</div>
              <div style={stepCard}>Configurar empresa</div>
              <div style={stepCard}>Convidar equipe</div>
              <div style={stepCard}>Cadastrar primeira Speaker</div>
            </div>

            <a href="/configuracoes" style={primaryLink}>
              Começar configuração
            </a>
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "11px", color: "#94a3b8" }}>
            Visão geral da operação com comunidades, speakers e creators
          </p>
        </div>

        <div style={grid6}>
          <Card label="Total Creators" value={total} />
          <Card label="Aprovados" value={aprovados} />
          <Card label="Em Análise" value={analise} />
          <Card label="Reprovados" value={reprovados} />
          <Card label="Receita Gerada" value="—" />
          <Card label="ROI Médio" value="—" />
        </div>

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
                <span style={{ color: "#0f766e" }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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

const welcomeCard = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)",
  border: "1px solid #ccfbf1",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "20px",
  boxShadow: "0 16px 45px rgba(15, 23, 42, 0.08)",
};

const welcomeTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "14px",
};

const welcomeIcon = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "white",
  color: "#0f766e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

const closeButton = {
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#64748b",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "11px",
  cursor: "pointer",
};

const welcomeTitle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: 800,
};

const welcomeText = {
  margin: "6px 0 18px",
  color: "#475569",
  fontSize: "14px",
};

const stepsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const stepCard = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "12px",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 600,
};

const primaryLink = {
  width: "fit-content",
  borderRadius: "12px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  color: "white",
  padding: "12px 18px",
  fontSize: "14px",
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
};
