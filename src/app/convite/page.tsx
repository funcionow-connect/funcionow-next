"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Convite = { codigo: string; empresa_id: string; empresa_nome: string; perfil_nome: string | null; destinatario_email: string | null; status: string; expira_em: string };

function ConviteContent() {
  const params = useSearchParams();
  const code = (params.get("code") || "").trim().toUpperCase();
  const [convite, setConvite] = useState<Convite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState(false);

  useEffect(() => {
    if (code) sessionStorage.setItem("funcionow_convite", code);
    const load = async () => {
      if (!code) { setError("Convite sem código."); setLoading(false); return; }
      const [{ data, error: inviteError }, { data: authData }] = await Promise.all([
        supabase.rpc("consultar_convite_empresa", { p_codigo: code }),
        supabase.auth.getSession(),
      ]);
      if (inviteError || !data?.[0]) setError("Convite não encontrado ou inválido.");
      else { setConvite(data[0] as Convite); if (data[0].status !== "pendente") setError("Este convite já foi utilizado ou expirou."); }
      setSession(Boolean(authData.session));
      setLoading(false);
    };
    void load();
  }, [code]);

  const aceitar = async () => {
    if (!code) return;
    setAccepting(true); setError("");
    const { error: acceptError } = await supabase.rpc("aceitar_convite_empresa", { p_codigo: code });
    if (acceptError) { setError(acceptError.message); setAccepting(false); return; }
    sessionStorage.removeItem("funcionow_convite");
    window.location.href = "/dashboard";
  };

  const loginUrl = `/login?convite=${encodeURIComponent(code)}`;
  const registerUrl = `/register?convite=${encodeURIComponent(code)}`;

  return <main style={page}>
    <div style={card}>
      <div style={mark}>F</div>
      <div style={eyebrow}>Funcionow Connect</div>
      {loading ? <p style={muted}>Verificando convite...</p> : error && !convite ? <><h1 style={title}>Convite indisponível</h1><p style={muted}>{error}</p><a href="/login" style={button}>Ir para o login</a></> : convite ? <>
        <h1 style={title}>Você foi convidado</h1>
        <p style={muted}>A empresa <strong>{convite.empresa_nome}</strong> convidou você para entrar como <strong>{convite.perfil_nome || "colaborador"}</strong>.</p>
        {error && <p style={errorText}>{error}</p>}
        {session ? <button onClick={() => void aceitar()} disabled={accepting || convite.status !== "pendente"} style={button}>{accepting ? "Vinculando..." : "Aceitar convite"}</button> : <div style={actions}><a href={loginUrl} style={button}>Já tenho uma conta</a><a href={registerUrl} style={secondary}>Criar conta</a></div>}
        <p style={foot}>Se você já possui cadastro, use o mesmo e-mail. Não é necessário criar uma segunda conta.</p>
      </> : null}
    </div>
  </main>;
}

export default function ConvitePage() {
  return <Suspense fallback={<main style={page}><div style={card}><p style={muted}>Carregando convite...</p></div></main>}><ConviteContent /></Suspense>;
}

const page={minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",background:"#f7f7fb",fontFamily:"Arial, sans-serif"};
const card={width:"min(100%,480px)",padding:"40px",background:"#fff",border:"1px solid #e8e4f3",borderRadius:"24px",boxShadow:"0 20px 50px rgba(28,18,60,.08)",textAlign:"center" as const};
const mark={width:"52px",height:"52px",margin:"0 auto 20px",display:"grid",placeItems:"center",borderRadius:"16px",background:"#a8ff00",color:"#15131d",fontSize:"28px",fontWeight:800};
const eyebrow={fontSize:"13px",fontWeight:700,color:"#7357b5",letterSpacing:".08em",textTransform:"uppercase" as const};
const title={margin:"18px 0 10px",fontSize:"32px",color:"#171426"};
const muted={color:"#6f6a7f",lineHeight:1.6};
const errorText={padding:"12px",borderRadius:"10px",background:"#fff1f1",color:"#b42318",fontSize:"14px"};
const actions={display:"grid",gap:"10px",marginTop:"24px"};
const button={display:"inline-block",padding:"13px 18px",border:0,borderRadius:"10px",background:"#7254b7",color:"white",fontWeight:700,textDecoration:"none",cursor:"pointer"};
const secondary={...button,background:"#f0ecfa",color:"#59418e"};
const foot={marginTop:"22px",fontSize:"12px",color:"#88829a"};


