"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AppLayout from "@/components/AppLayout";

type UsuarioEmpresa = {
  empresa_id: string;
};

type Creator = {
  creator_id: string;
  empresa_id: string;
  nome: string | null;
  instagram: string | null;
  status: string | null;
  score_total: number | null;
  criado_em: string | null;
  foto_url: string | null;
  categoria_id: string | null;
};

export default function EditCreatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creator_id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [status, setStatus] = useState("em_analise");

  useEffect(() => {
    const loadCreator = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || !creatorId) {
        setLoading(false);
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("usuario_id", session.user.id)
        .single<UsuarioEmpresa>();

      if (usuarioError || !usuario?.empresa_id) {
        console.error("Erro ao buscar empresa do usuário:", usuarioError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("empresa_id", usuario.empresa_id)
        .single<Creator>();

      if (error || !data) {
        console.error("Erro ao buscar creator:", error);
        setLoading(false);
        return;
      }

      setNome(data.nome || "");
      setInstagram(data.instagram || "");
      setStatus(data.status || "em_analise");
      setLoading(false);
    };

    setTimeout(loadCreator, 300);
  }, [creatorId]);

  const handleSave = async () => {
    if (!nome.trim() || !instagram.trim()) {
      alert("Preencha nome e instagram.");
      return;
    }

    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user || !creatorId) {
      setSaving(false);
      return;
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("usuario_id", session.user.id)
      .single<UsuarioEmpresa>();

    if (usuarioError || !usuario?.empresa_id) {
      alert("Erro ao buscar empresa do usuário.");
      setSaving(false);
      return;
    }

    const instagramLimpo = instagram.replace("@", "").trim();

    const { error } = await supabase
      .from("creators")
      .update({
        nome: nome.trim(),
        instagram: instagramLimpo,
        status,
      })
      .eq("creator_id", creatorId)
      .eq("empresa_id", usuario.empresa_id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/creators/detail?creator_id=${creatorId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: "520px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
          Editar Creator
        </h1>

        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            display: "grid",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={inputStyle}
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label style={labelStyle}>Instagram</label>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              style={inputStyle}
              placeholder="@perfil"
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="em_analise">em_analise</option>
              <option value="potencial">potencial</option>
              <option value="aprovado">aprovado</option>
              <option value="reprovado">reprovado</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={handleSave} disabled={saving} style={primaryButton}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>

            <button
              onClick={() => router.back()}
              style={secondaryButton}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#374151",
  marginBottom: "4px",
};

const inputStyle = {
  width: "100%",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  fontSize: "13px",
  boxSizing: "border-box" as const,
};

const primaryButton = {
  borderRadius: "8px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  padding: "10px 14px",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
};

const secondaryButton = {
  borderRadius: "8px",
  background: "white",
  padding: "10px 14px",
  color: "#111827",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
};