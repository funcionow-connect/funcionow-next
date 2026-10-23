"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { recoverySupabase } from "@/lib/recoverySupabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ativo = true;

    const prepararSessao = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      let exchangeError = null;

      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        exchangeError = result.error;
      }

      // Links enviados pelo fluxo implícito chegam com os tokens no hash.
      // O hash nunca é enviado ao servidor e permite abrir o link em outro dispositivo.
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (!code && accessToken && refreshToken) {
        const result = await recoverySupabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        exchangeError = result.error;
        if (!result.error) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const { data } = await recoverySupabase.auth.getSession();
      if (!ativo) return;

      if (!data.session) {
        setMessage(
          exchangeError
            ? "Este link de recuperação expirou ou já foi utilizado. Solicite um novo link."
            : "Abra esta página pelo link recebido no e-mail para criar uma nova senha.",
        );
      }
      setReady(true);
    };

    void prepararSessao();
    return () => {
      ativo = false;
    };
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      setMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não conferem. Revise os dois campos.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { data: sessionData } = await recoverySupabase.auth.getSession();
      if (!sessionData.session) {
        setMessage("Este link de recuperação expirou ou já foi utilizado. Solicite um novo link.");
        return;
      }

      const { error } = await recoverySupabase.auth.updateUser({
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("same_password")) {
          setMessage("A nova senha é igual à senha atual. Para manter a mesma senha, você não precisa alterá-la. Se quiser trocar, acesse seu perfil e escolha uma senha diferente.");
          return;
        }
        setMessage("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
        return;
      }

      setUpdated(true);
    } catch (err) {
      console.error("Erro ao atualizar senha:", err);
      setMessage("Não foi possível atualizar a senha agora. Tente novamente.");
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
            {message && <div style={errorBox}>{message}</div>}
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
              disabled={loading || !ready || Boolean(!message && !ready)}
              style={buttonStyle}
            >
              {!ready ? "Validando link..." : loading ? "Atualizando..." : "Atualizar senha"}
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

