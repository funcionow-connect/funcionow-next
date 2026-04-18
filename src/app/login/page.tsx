"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const handleLogin = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

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
              Bem-vindo de volta
            </h1>

            <p
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Entre na sua conta Funcionow Connect
            </p>
          </div>

          <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "14px", color: "#374151" }}>
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
onChange={(e) => setEmail(e.target.value)}
                style={{
                  marginTop: "4px",
                  width: "100%",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "14px", color: "#374151" }}>
                Senha
              </label>
              <div style={{ position: "relative", marginTop: "4px" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    padding: "10px 48px 10px 12px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "12px",
                    color: "#6b7280",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button
            onClick={handleLogin}
              style={{
                width: "100%",
                borderRadius: "6px",
                background: "linear-gradient(to right, #0f766e, #14b8a6)",
                padding: "10px 12px",
                fontSize: "14px",
                fontWeight: 500,
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Entrar
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Não tem uma conta?{" "}
              <a href="/register" style={{ color: "#0d9488", cursor: "pointer" }}>
  Criar conta
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
          <h2
            style={{
              margin: "0 auto",
              maxWidth: "360px",
              fontSize: "36px",
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            Gerencie creators como nunca antes
          </h2>

          <p
            style={{
              margin: "16px auto 0",
              maxWidth: "340px",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            CRM, analytics, campanhas e IA integrados em uma única plataforma premium.
          </p>
        </div>
      </section>
    </main>
  );
}