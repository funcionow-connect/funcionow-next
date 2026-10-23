"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { recoverySupabase } from "@/lib/recoverySupabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  const handleRecover = async () => {
    if (!email.trim()) {
      setMessage("Informe seu e-mail para continuar.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setNotFound(false);

      const { data: emailEncontrado, error: consultaError } = await supabase.rpc(
        "email_tem_conta",
        { p_email: email.trim() },
      );

      if (consultaError) {
        throw consultaError;
      }

      if (emailEncontrado === false) {
        setNotFound(true);
        return;
      }

      const { error } = await recoverySupabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://funcionow-next.vercel.app/reset-password",
      });

      if (error) {
        const mensagem = error.message.toLowerCase();
        if (mensagem.includes("rate limit") || mensagem.includes("too many requests")) {
          setMessage("O limite de envio de e-mails foi atingido. Aguarde alguns minutos antes de solicitar um novo link.");
        } else {
          setMessage("Não foi possível enviar o link agora. Confira o e-mail e tente novamente.");
        }
        return;
      }

      setSent(true);
    } catch (err) {
      console.error("Erro ao enviar recuperação:", err);
      setMessage("Não foi possível conectar ao serviço de recuperação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Recuperar senha</h1>

        <p style={textStyle}>
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </p>

        {sent ? (
          <div style={successBox}>
            Link enviado. Verifique sua caixa de entrada e o spam.
          </div>
        ) : notFound ? (
          <div style={notFoundBox}>
            Este e-mail ainda não foi encontrado como usuário cadastrado.
            Crie uma conta antes de solicitar a recuperação de senha.
          </div>
        ) : (
          <>
            {message && <div style={errorBox}>{message}</div>}
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <button onClick={handleRecover} disabled={loading} style={buttonStyle}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </>
        )}

        <a href="/login" style={linkStyle}>
          Voltar para o login
        </a>
      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #ffffff 0%, #fbfbfd 70%, #f3efff 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "white",
  borderRadius: "16px",
  padding: "32px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 16px 45px rgba(15, 23, 42, 0.08)",
};

const titleStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 700,
  color: "#111827",
};

const textStyle = {
  marginTop: "8px",
  marginBottom: "20px",
  fontSize: "14px",
  color: "#6b7280",
  lineHeight: 1.5,
};

const inputStyle = {
  width: "100%",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "11px 12px",
  fontSize: "14px",
  boxSizing: "border-box" as const,
  marginBottom: "14px",
};

const buttonStyle = {
  width: "100%",
  borderRadius: "8px",
  background: "#b8ff00",
  padding: "11px 12px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#29272d",
  border: "none",
  cursor: "pointer",
};

const successBox = {
  background: "#f3efff",
  color: "#7654c7",
  border: "1px solid #e5def8",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "14px",
  marginBottom: "16px",
};

const errorBox = {
  background: "#fff5f5",
  color: "#b42318",
  border: "1px solid #f3c7c3",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "14px",
  lineHeight: 1.5,
  marginBottom: "16px",
};

const notFoundBox = {
  background: "#fff8e6",
  color: "#8a5a00",
  border: "1px solid #f2d38a",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "14px",
  lineHeight: 1.5,
  marginBottom: "16px",
};

const linkStyle = {
  display: "block",
  marginTop: "18px",
  textAlign: "center" as const,
  fontSize: "14px",
  color: "#7654c7",
  textDecoration: "none",
};

