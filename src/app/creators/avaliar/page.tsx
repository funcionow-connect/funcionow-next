"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabaseClient";

type UsuarioEmpresa = {
  empresa_id: string;
};

type CreatorResumo = {
  creator_id: string;
  empresa_id: string;
  nome: string | null;
  instagram: string | null;
  categoria_nome: string | null;
  segmento_nome: string | null;
  area_speaker_nome: string | null;
  status: string | null;
  score_parcial: number | null;
};

type Criterio = {
  criterio_id: string;
  nome: string;
  peso: number | null;
  ordem: number | null;
  tipo_resposta: string | null;
};

export default function AvaliarCreatorPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
        </AppLayout>
      }
    >
      <AvaliarCreatorContent />
    </Suspense>
  );
}

function AvaliarCreatorContent() {
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creator_id");

  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<CreatorResumo | null>(null);
  const [criterios, setCriterios] = useState<Criterio[]>([]);

  useEffect(() => {
    const loadPage = async () => {
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

      const [creatorRes, criteriosRes] = await Promise.all([
        supabase
          .from("v_creator_detalhe")
          .select(
            "creator_id, empresa_id, nome, instagram, categoria_nome, segmento_nome, area_speaker_nome, status, score_parcial"
          )
          .eq("creator_id", creatorId)
          .eq("empresa_id", usuario.empresa_id)
          .single<CreatorResumo>(),

        supabase
          .from("criterios_avaliacao")
          .select("criterio_id, nome, peso, ordem, tipo_resposta")
          .eq("empresa_id", usuario.empresa_id)
          .order("ordem", { ascending: true }),
      ]);

      if (creatorRes.error) {
        console.error("Erro ao buscar creator:", creatorRes.error);
        setCreator(null);
      } else {
        setCreator(creatorRes.data as CreatorResumo);
      }

      if (criteriosRes.error) {
        console.error("Erro ao buscar critérios:", criteriosRes.error);
        setCriterios([]);
      } else {
        setCriterios((criteriosRes.data as Criterio[]) || []);
      }

      setLoading(false);
    };

    setTimeout(loadPage, 300);
  }, [creatorId]);

  if (loading) {
    return (
      <AppLayout>
        <div style={{ color: "#6b7280", fontSize: "14px" }}>Carregando...</div>
      </AppLayout>
    );
  }

  if (!creator) {
    return (
      <AppLayout>
        <div style={{ color: "#6b7280", fontSize: "14px" }}>
          Creator não encontrado.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: "900px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <a
            href={`/creators/detail?creator_id=${creator.creator_id}`}
            style={{
              fontSize: "12px",
              color: "#6b7280",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Voltar ao detalhe
          </a>
        </div>

        <div style={card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "999px",
                background: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              👤
            </div>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Avaliar Creator
              </h1>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#6b7280",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span>{creator.nome || "Sem nome"}</span>
                <span>@{creator.instagram || "-"}</span>
                <span>{creator.categoria_nome || "-"}</span>
                <span>
                  {creator.segmento_nome || creator.area_speaker_nome || "-"}
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "6px",
                background:
                  creator.status === "aprovado"
                    ? "#dcfce7"
                    : creator.status === "reprovado"
                    ? "#fee2e2"
                    : creator.status === "potencial"
                    ? "#dbeafe"
                    : "#fef9c3",
                color:
                  creator.status === "aprovado"
                    ? "#166534"
                    : creator.status === "reprovado"
                    ? "#991b1b"
                    : creator.status === "potencial"
                    ? "#1d4ed8"
                    : "#854d0e",
                fontWeight: 600,
              }}
            >
              {creator.status || "em_analise"}
            </div>
          </div>
        </div>

        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Critérios de avaliação
            </h2>

            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Score atual: {creator.score_parcial ?? "-"}
            </div>
          </div>

          {criterios.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Nenhum critério cadastrado para esta empresa.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {criterios.map((criterio) => (
                <div key={criterio.criterio_id} style={criterioCard}>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#111827",
                        marginBottom: "4px",
                      }}
                    >
                      {criterio.nome}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        fontSize: "11px",
                        color: "#6b7280",
                      }}
                    >
                      <span>Ordem: {criterio.ordem ?? "-"}</span>
                      <span>Peso: {criterio.peso ?? "-"}</span>
                      <span>Tipo: {criterio.tipo_resposta ?? "-"}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Campo de resposta entra no próximo passo
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
  marginBottom: "12px",
};

const criterioCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px",
  background: "#fafafa",
};