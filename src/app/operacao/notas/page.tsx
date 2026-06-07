"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UsuarioAtual = {
  usuario_id: string;
  empresa_id: string;
  nome: string | null;
  email: string | null;
};

type Projeto = {
  projeto_id: string;
  nome: string;
};

type Nota = {
  nota_id: string;
  empresa_id: string;
  projeto_id: string | null;
  titulo: string;
  conteudo: string | null;
  tipo:
    | "nota"
    | "processo"
    | "ata"
    | "ideia"
    | "script"
    | "produto"
    | "estrategia"
    | "outro";
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  projetos?: {
    nome: string;
  } | null;
};

const tipoOptions = [
  { value: "nota", label: "Nota" },
  { value: "processo", label: "Processo" },
  { value: "ata", label: "Ata" },
  { value: "ideia", label: "Ideia" },
  { value: "script", label: "Script" },
  { value: "produto", label: "Produto" },
  { value: "estrategia", label: "Estratégia" },
  { value: "outro", label: "Outro" },
] as const;

export default function NotasPage() {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [projetoFiltro, setProjetoFiltro] = useState("todos");

  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState<Nota["tipo"]>("nota");
  const [projetoId, setProjetoId] = useState("");

  const notasFiltradas = useMemo(() => {
    return notas.filter((nota) => {
      const textoBusca = busca.trim().toLowerCase();

      const bateBusca =
        !textoBusca ||
        nota.titulo.toLowerCase().includes(textoBusca) ||
        nota.conteudo?.toLowerCase().includes(textoBusca) ||
        nota.projetos?.nome?.toLowerCase().includes(textoBusca);

      const bateTipo = tipoFiltro === "todos" || nota.tipo === tipoFiltro;

      const bateProjeto =
        projetoFiltro === "todos" || nota.projeto_id === projetoFiltro;

      return bateBusca && bateTipo && bateProjeto;
    });
  }, [notas, busca, tipoFiltro, projetoFiltro]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("Erro ao buscar usuário autenticado:", authError);
        window.location.href = "/login";
        return;
      }

      const authUserId = authData.user?.id;

      if (!authUserId) {
        window.location.href = "/login";
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("usuario_id, empresa_id, nome, email")
        .eq("usuario_id", authUserId)
        .maybeSingle<UsuarioAtual>();

      if (usuarioError) {
        console.error("Erro ao buscar usuário:", usuarioError);
        alert("Não foi possível carregar os dados do usuário.");
        return;
      }

      if (!usuario?.empresa_id) {
        window.location.href = "/perfil";
        return;
      }

      setUsuarioAtual(usuario);

      const [projetosResult, notasResult] = await Promise.all([
        supabase
          .from("projetos")
          .select("projeto_id, nome")
          .eq("empresa_id", usuario.empresa_id)
          .order("nome", { ascending: true }),

        supabase
          .from("notas")
          .select(
            `
            *,
            projetos (
              nome
            )
          `
          )
          .eq("empresa_id", usuario.empresa_id)
          .order("criado_em", { ascending: false }),
      ]);

      if (projetosResult.error) {
        console.error("Erro ao carregar projetos:", projetosResult.error);
        alert("Não foi possível carregar os projetos.");
        return;
      }

      if (notasResult.error) {
        console.error("Erro ao carregar notas:", notasResult.error);
        alert("Não foi possível carregar as notas.");
        return;
      }

      setProjetos((projetosResult.data ?? []) as Projeto[]);
      setNotas((notasResult.data ?? []) as Nota[]);
    } catch (error) {
      console.error("Erro inesperado ao carregar notas:", error);
      alert("Erro inesperado ao carregar notas.");
    } finally {
      setLoading(false);
    }
  };

  const criarNota = async () => {
    if (!usuarioAtual) {
      alert("Usuário não carregado.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título da nota.");
      return;
    }

    if (titulo.trim().length > 120) {
      alert("O título da nota deve ter no máximo 120 caracteres.");
      return;
    }

    if (titulo.includes("use client") || titulo.includes("import ")) {
      alert("O título parece conter código. Revise antes de salvar.");
      return;
    }

    try {
      setSalvando(true);

      const { error } = await supabase.from("notas").insert({
        empresa_id: usuarioAtual.empresa_id,
        projeto_id: projetoId || null,
        titulo: titulo.trim(),
        conteudo: conteudo.trim() || null,
        tipo,
        criado_por: usuarioAtual.usuario_id,
      });

      if (error) {
        console.error("Erro ao criar nota:", error);
        alert("Não foi possível criar a nota.");
        return;
      }

      setTitulo("");
      setConteudo("");
      setTipo("nota");
      setProjetoId("");

      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao criar nota:", error);
      alert("Erro inesperado ao criar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirNota = async (notaId: string) => {
    const confirmar = window.confirm("Deseja excluir esta nota?");

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("notas")
        .delete()
        .eq("nota_id", notaId);

      if (error) {
        console.error("Erro ao excluir nota:", error);
        alert("Não foi possível excluir a nota.");
        return;
      }

      setNotas((lista) => lista.filter((nota) => nota.nota_id !== notaId));
    } catch (error) {
      console.error("Erro inesperado ao excluir nota:", error);
      alert("Erro inesperado ao excluir nota.");
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "24px",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div>
            <p style={eyebrowStyle}>Operação</p>

            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Notas
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "14px",
                maxWidth: "720px",
              }}
            >
              Registre informações importantes da operação: produto,
              posicionamento, scripts, processos, atas, ideias e estratégias.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <a href="/operacao" style={linkStyle}>
              Dashboard Operacional
            </a>
            <a href="/operacao/reunioes" style={linkStyle}>
              Reuniões
            </a>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: "24px",
            alignItems: "flex-start",
          }}
        >
          <aside style={cardStyle}>
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              Nova nota
            </h2>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Título</label>
                <input
                  value={titulo}
                  onChange={(event) =>
                    setTitulo(event.target.value.slice(0, 120))
                  }
                  maxLength={120}
                  placeholder="Ex: Posicionamento do produto"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Projeto</label>
                <select
                  value={projetoId}
                  onChange={(event) => setProjetoId(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">Sem projeto vinculado</option>
                  {projetos.map((projeto) => (
                    <option key={projeto.projeto_id} value={projeto.projeto_id}>
                      {projeto.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tipo</label>
                <select
                  value={tipo}
                  onChange={(event) =>
                    setTipo(event.target.value as Nota["tipo"])
                  }
                  style={inputStyle}
                >
                  {tipoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Conteúdo</label>
                <textarea
                  value={conteudo}
                  onChange={(event) => setConteudo(event.target.value)}
                  rows={10}
                  placeholder="Escreva aqui a informação, processo, ideia ou registro importante."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                onClick={criarNota}
                disabled={salvando}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  padding: "11px 14px",
                  background: "linear-gradient(to right, #0f766e, #14b8a6)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: salvando ? "not-allowed" : "pointer",
                  opacity: salvando ? 0.75 : 1,
                }}
              >
                {salvando ? "Salvando..." : "Criar nota"}
              </button>
            </div>
          </aside>

          <section>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                alignItems: "center",
              }}
            >
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar nota..."
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "280px",
                }}
              />

              <select
                value={tipoFiltro}
                onChange={(event) => setTipoFiltro(event.target.value)}
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "190px",
                }}
              >
                <option value="todos">Todos os tipos</option>
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={projetoFiltro}
                onChange={(event) => setProjetoFiltro(event.target.value)}
                style={{
                  ...inputStyle,
                  background: "white",
                  maxWidth: "220px",
                }}
              >
                <option value="todos">Todos os projetos</option>
                {projetos.map((projeto) => (
                  <option key={projeto.projeto_id} value={projeto.projeto_id}>
                    {projeto.nome}
                  </option>
                ))}
              </select>

              <div
                style={{
                  marginLeft: "auto",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                {notasFiltradas.length} nota(s)
              </div>
            </div>

            {loading ? (
              <div style={emptyStateStyle}>Carregando notas...</div>
            ) : notasFiltradas.length === 0 ? (
              <div style={emptyStateStyle}>Nenhuma nota encontrada.</div>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {notasFiltradas.map((nota) => (
                  <article key={nota.nota_id} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "17px",
                            fontWeight: 800,
                          }}
                        >
                          {nota.titulo}
                        </h3>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <Badge text={formatarTipo(nota.tipo)} />

                          {nota.projetos?.nome && (
                            <Badge text={`Projeto: ${nota.projetos.nome}`} />
                          )}

                          <Badge text={formatarDataHora(nota.criado_em)} />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => excluirNota(nota.nota_id)}
                        style={{
                          border: "1px solid #fee2e2",
                          borderRadius: "10px",
                          background: "#fff",
                          color: "#dc2626",
                          padding: "8px 10px",
                          fontSize: "13px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Excluir
                      </button>
                    </div>

                    {nota.conteudo && (
                      <p
                        style={{
                          margin: "14px 0 0",
                          whiteSpace: "pre-wrap",
                          color: "#475569",
                          fontSize: "13px",
                          lineHeight: 1.6,
                        }}
                      >
                        {nota.conteudo}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        background: "#f1f5f9",
        color: "#475569",
        fontSize: "12px",
        fontWeight: 800,
        padding: "5px 9px",
      }}
    >
      {text}
    </span>
  );
}

function formatarTipo(tipo: Nota["tipo"]) {
  const item = tipoOptions.find((option) => option.value === tipo);
  return item?.label ?? tipo;
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#0f766e",
  fontWeight: 700,
};

const linkStyle: React.CSSProperties = {
  color: "#0f766e",
  fontSize: "14px",
  textDecoration: "none",
  fontWeight: 800,
};

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 700,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const emptyStateStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "32px",
  textAlign: "center",
  color: "#6b7280",
  fontSize: "14px",
};