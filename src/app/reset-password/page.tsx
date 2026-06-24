"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      alert("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setUpdated(true);
    } catch (err) {
      console.error("Erro ao atualizar senha:", err);
      alert("Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Criar nova senha</h1>

        <p style={textStyle}>Digite sua nova senha para acessar a plataforma.</p>

        {updated ? (
          <>
            <div style={successBox}>Senha atualizada com sucesso.</div>
            <a href="/login" style={buttonLinkStyle}>
              Ir para o login
            </a>
          </>
        ) : (
          <>
            <input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={handleUpdatePassword}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? "Atualizando..." : "Atualizar senha"}
            </button>
          </>
        )}
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

const buttonLinkStyle = {
  display: "block",
  width: "100%",
  borderRadius: "8px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  padding: "11px 12px",
  fontSize: "14px",
  fontWeight: 600,
  color: "white",
  textAlign: "center" as const,
  textDecoration: "none",
  boxSizing: "border-box" as const,
};