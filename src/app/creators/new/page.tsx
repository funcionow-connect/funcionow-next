"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NewCreatorPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);

    // pega usuário logado
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      alert("Usuário não autenticado");
      setLoading(false);
      return;
    }

    // pega empresa do usuário
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("usuario_id", user.id)
      .single();

    if (!usuario) {
      alert("Erro ao buscar empresa");
      setLoading(false);
      return;
    }

    // cria creator
    const { error } = await supabase.from("creators").insert([
      {
        nome,
        instagram,
        empresa_id: usuario.empresa_id,
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