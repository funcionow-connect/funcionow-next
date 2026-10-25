"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getActiveCompanyContext, requirePagePermission } from "@/lib/accessControl";
import { useRouter } from "next/navigation";


export default function NewCreatorPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!(await requirePagePermission("creators", "pode_criar"))) return;
    setLoading(true);

    const contexto = await getActiveCompanyContext();
    if (!contexto) {
      alert("Não foi possível identificar a empresa ativa.");
      setLoading(false);
      return;
    }

    // cria creator
    const { error } = await supabase.from("creators").insert([
      {
        nome,
        instagram,
        empresa_id: contexto.empresaId,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/creators");
  };

  return (
    <div style={{ padding: "32px", maxWidth: "400px" }}>
      <h1>Novo Creator</h1>

      <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <input
          placeholder="@instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />

        <button onClick={handleCreate} disabled={loading}>
          {loading ? "Salvando..." : "Criar"}
        </button>
      </div>
    </div>
);
}
