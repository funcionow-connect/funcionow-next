"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const modules: Record<string, { nome: string; descricao: string; recursos: string[]; valor: string }> = {
  operacao: { nome: "Operação", descricao: "Organize a execução diária da empresa em um só lugar.", recursos: ["Projetos e tarefas", "Reuniões com decisões e encaminhamentos", "Calendário operacional", "Biblioteca de notas"], valor: "Adicionar ao plano" },
  crescimento: { nome: "Crescimento", descricao: "Transforme a rede de creators em campanhas, desenvolvimento e resultados.", recursos: ["Campanhas e entregáveis", "Academia de desenvolvimento", "Recompensas", "Análises de desempenho"], valor: "Adicionar ao plano" },
};

export default function UpgradePage() {
  const params = useSearchParams();
  const key = params.get("modulo") || "operacao";
  const modulo = modules[key] || modules.operacao;
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 0" }}>
      <Link href="/dashboard" style={{ color: "#6b4eff", fontSize: "13px", textDecoration: "none" }}>← Voltar ao painel</Link>
      <div style={{ marginTop: "28px", background: "#fff", border: "1px solid #e3e5eb", borderRadius: "18px", padding: "30px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b4eff" }}>Módulo disponível no upgrade</div>
        <h1 style={{ margin: "10px 0 8px", fontSize: "30px", color: "#182033" }}>{modulo.nome}</h1>
        <p style={{ margin: 0, color: "#5f6673", fontSize: "16px", lineHeight: 1.5 }}>{modulo.descricao}</p>
        <h2 style={{ margin: "28px 0 12px", fontSize: "16px", color: "#182033" }}>O que sua empresa terá</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", color: "#404858", lineHeight: 1.9 }}>{modulo.recursos.map((recurso) => <li key={recurso}>{recurso}</li>)}</ul>
        <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #edf0f4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div><strong style={{ display: "block", fontSize: "18px", color: "#182033" }}>{modulo.valor}</strong><span style={{ color: "#737b8c", fontSize: "12px" }}>O preço será definido no catálogo comercial da plataforma.</span></div>
          <button type="button" disabled style={{ border: 0, borderRadius: "10px", padding: "12px 18px", background: "#b6ff00", color: "#182033", fontWeight: 700, cursor: "not-allowed" }}>Solicitar upgrade</button>
        </div>
      </div>
    </div>
  );
}
