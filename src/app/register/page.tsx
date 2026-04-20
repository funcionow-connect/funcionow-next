"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          empresa_nome: empresa,
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Conta criada com sucesso!");
    window.location.href = "/dashboard";
  };

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        height: "100vh",
        width: "100%",
      }}
    >
      <section
        style={{
          background: "#f5f5f6",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "96px",
          paddingLeft: "24px",
          paddingRight: "24px",
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
              Comece a gerenciar sua operação agora
            </p>
          </div>

          <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Seu nome</label>
              <input
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nome da empresa</label>
              <input
                placeholder="Sua empresa"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                style={inputStyle}
              />
            </div>

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
                  style={inputStyle}
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

            <button style={buttonStyle} onClick={handleRegister}>
              Criar conta
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

const inputStyle = {
  width: "100%",
  borderRadius: "6px",
  border: "1px solid #e5e7eb",
  padding: "10px 48px 10px 12px",
  fontSize: "14px",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  width: "100%",
  borderRadius: "6px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  padding: "10px",
  color: "white",
  border: "none",
  cursor: "pointer",
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