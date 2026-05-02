"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TipoCadastro = "empresa" | "usuario";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro>("empresa");

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nome.trim()) {
      alert("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      alert("Informe seu e-mail.");
      return;
    }

    if (!password.trim() || password.length < 6) {
      alert("Informe uma senha com pelo menos 6 caracteres.");
      return;
    }

    if (tipoCadastro === "empresa" && !empresa.trim()) {
      alert("Informe o nome da empresa.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            tipo_cadastro: tipoCadastro,
            nome: nome.trim(),
            empresa_nome: tipoCadastro === "empresa" ? empresa.trim() : null,
          },
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (tipoCadastro === "empresa") {
        alert("Conta e empresa criadas com sucesso!");
        window.location.href = "/dashboard";
        return;
      }

      alert("Conta criada com sucesso! Complete seu perfil.");
      window.location.href = "/perfil";
    } catch (err) {
      console.error("Erro inesperado ao criar conta:", err);
      alert("Erro de conexão ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <section
        style={{
          background: "#f5f5f6",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "72px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingBottom: "32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                margin: "0 auto 24px",
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(to right, #0f766e, #14b8a6)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✦
            </div>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#111827",
                margin: 0,
              }}
            >
              Crie sua conta
            </h1>

            <p
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Escolha como deseja se cadastrar
            </p>
          </div>

          <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Tipo de cadastro</label>

              <div style={tipoCadastroBox}>
                <button
                  type="button"
                  onClick={() => setTipoCadastro("empresa")}
                  style={{
                    ...tipoCadastroButton,
                    ...(tipoCadastro === "empresa"
                      ? tipoCadastroButtonActive
                      : {}),
                  }}
                >
                  Empresa
                </button>

                <button
                  type="button"
                  onClick={() => setTipoCadastro("usuario")}
                  style={{
                    ...tipoCadastroButton,
                    ...(tipoCadastro === "usuario"
                      ? tipoCadastroButtonActive
                      : {}),
                  }}
                >
                  Usuário / colaborador
                </button>
              </div>

              <p style={helperText}>
                {tipoCadastro === "empresa"
                  ? "Use esta opção para criar uma nova empresa e entrar como administrador."
                  : "Use esta opção se você será vinculado depois a uma empresa por código."}
              </p>
            </div>

            <div>
              <label style={labelStyle}>Seu nome</label>
              <input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={inputStyle}
              />
            </div>

            {tipoCadastro === "empresa" && (
              <div>
                <label style={labelStyle}>Nome da empresa</label>
                <input
                  placeholder="Sua empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputWithButtonStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={showButton}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button style={buttonStyle} onClick={handleRegister} disabled={loading}>
              {loading
                ? "Criando conta..."
                : tipoCadastro === "empresa"
                ? "Criar empresa"
                : "Criar usuário"}
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Já tem conta?{" "}
              <a href="/" style={{ color: "#0d9488" }}>
                Entrar
              </a>
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          background:
            "linear-gradient(135deg, #0b1220 0%, #172554 55%, #0f766e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <div style={{ maxWidth: "420px", textAlign: "center", color: "white" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 600 }}>
            Escale sua operação com creators
          </h2>

          <p style={{ marginTop: "12px", opacity: 0.7 }}>
            Plataforma completa para captar, avaliar e gerenciar creators
            afiliados.
          </p>
        </div>
      </section>
    </main>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#374151",
  marginBottom: "4px",
};

const helperText = {
  fontSize: "11px",
  color: "#6b7280",
  margin: "6px 0 0",
  lineHeight: 1.4,
};

const inputStyle = {
  width: "100%",
  borderRadius: "6px",
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  fontSize: "14px",
  boxSizing: "border-box" as const,
  background: "white",
};

const inputWithButtonStyle = {
  ...inputStyle,
  padding: "10px 64px 10px 12px",
};

const buttonStyle = {
  width: "100%",
  borderRadius: "6px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  padding: "10px",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};

const showButton = {
  position: "absolute" as const,
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "12px",
  color: "#6b7280",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const tipoCadastroBox = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
};

const tipoCadastroButton = {
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#6b7280",
  borderRadius: "8px",
  padding: "10px 8px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const tipoCadastroButtonActive = {
  background: "#ccfbf1",
  color: "#0f766e",
  border: "1px solid #14b8a6",
};