"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRecover = async () => {
    if (!email.trim()) {
      alert("Informe seu e-mail.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setSent(true);
    } catch (err) {
      console.error("Erro ao enviar recuperação:", err);
      alert("Erro de conexão ao enviar recuperação de senha.");
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
            Link enviado. Verifique sua caixa de entrada.
          </div>
        ) : (
          <>
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
  background: "#f5f5f6",
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
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  padding: "11px 12px",
  fontSize: "14px",
  fontWeight: 600,
  color: "white",
  border: "none",
  cursor: "pointer",
};

const successBox = {
  background: "#f0fdfa",
  color: "#0f766e",
  border: "1px solid #ccfbf1",
  borderRadius: "10px",
  padding: "12px",
  fontSize: "14px",
  marginBottom: "16px",
};

const linkStyle = {
  display: "block",
  marginTop: "18px",
  textAlign: "center" as const,
  fontSize: "14px",
  color: "#0d9488",
  textDecoration: "none",
};