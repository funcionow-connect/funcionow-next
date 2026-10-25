"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getActiveCompanyContext, requirePagePermission } from "@/lib/accessControl";

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

type MembroEquipe = {
  membro_id: string;
  usuario_id: string | null;
  nome: string;
  cargo: string | null;
  status: string | null;
};

type Reuniao = { reuniao_id: string; titulo: string };

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
  visibilidade: "somente_eu" | "empresa" | "gerencia" | "selecionados";
  reuniao_id: string | null;
  reunioes?: { titulo: string } | null;
  nota_permissoes?: Array<{ usuario_id: string }>;
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
  const [membrosEquipe, setMembrosEquipe] = useState<MembroEquipe[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
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
  const [reuniaoId, setReuniaoId] = useState("");
  const [visibilidade, setVisibilidade] = useState<Nota["visibilidade"]>("somente_eu");
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editandoNotaId, setEditandoNotaId] = useState<string | null>(null);
  const [editorAberto, setEditorAberto] = useState(false);

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

      const contexto = await getActiveCompanyContext();
      if (!contexto || contexto.userId !== authUserId) {
        window.location.href = "/perfil";
        return;
      }

      const { data: usuarioBase, error: usuarioError } = await supabase
        .from("usuarios")
        .select("usuario_id, nome, email")
        .eq("usuario_id", authUserId)
        .maybeSingle<Omit<UsuarioAtual, "empresa_id">>();

      if (usuarioError) {
        console.error("Erro ao buscar usuário:", usuarioError);
        alert("Não foi possível carregar os dados do usuário.");
        return;
      }

      if (!usuarioBase) {
        window.location.href = "/perfil";
        return;
      }

      const usuario: UsuarioAtual = { ...usuarioBase, empresa_id: contexto.empresaId };
      setUsuarioAtual(usuario);

      const [projetosResult, membrosResult, reunioesResult, notasResult] = await Promise.all([
        supabase.from("projetos").select("projeto_id, nome").eq("empresa_id", usuario.empresa_id).order("nome", { ascending: true }),
        supabase.from("membros_equipe").select("membro_id, usuario_id, nome, cargo, status").eq("empresa_id", usuario.empresa_id).eq("status", "ativo").order("nome", { ascending: true }),
        supabase.from("reunioes").select("reuniao_id, titulo").eq("empresa_id", usuario.empresa_id).order("data_inicio", { ascending: false }),
        supabase.from("notas").select("*, projetos ( nome ), reunioes ( titulo ), nota_permissoes ( usuario_id )").eq("empresa_id", usuario.empresa_id).order("criado_em", { ascending: false }),
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
      setMembrosEquipe((membrosResult.data ?? []) as MembroEquipe[]);
      setReunioes((reunioesResult.data ?? []) as Reuniao[]);
      setNotas((notasResult.data ?? []) as Nota[]);
    } catch (error) {
      console.error("Erro inesperado ao carregar notas:", error);
      alert("Erro inesperado ao carregar notas.");
    } finally {
      setLoading(false);
    }
  };

  const criarNota = async () => {
    if (!(await requirePagePermission("operacao_notas", "pode_criar"))) return;
    if (!usuarioAtual) {
      alert("Usuário não carregado.");
      return;
    }

    const conteudoTexto = editorRef.current?.innerText.trim() ?? "";

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

      const { data: notaCriada, error } = await supabase.from("notas").insert({
        empresa_id: usuarioAtual.empresa_id,
        projeto_id: projetoId || null,
        reuniao_id: reuniaoId || null,
        titulo: titulo.trim(),
        conteudo: conteudo.trim() || conteudoTexto || null,
        tipo,
        visibilidade,
        criado_por: usuarioAtual.usuario_id,
      }).select("nota_id");

      if (error) {
        console.error("Erro ao criar nota:", error);
        alert("Não foi possível criar a nota.");
        return;
      }

      if (notaCriada?.[0]?.nota_id && visibilidade === "selecionados" && usuariosSelecionados.length > 0) {
        const { error: permissaoError } = await supabase.from("nota_permissoes").insert(usuariosSelecionados.map((usuarioId) => ({ nota_id: notaCriada[0].nota_id, empresa_id: usuarioAtual.empresa_id, usuario_id: usuarioId })));
        if (permissaoError) console.error("Erro ao salvar permissões da nota:", permissaoError);
      }

      setTitulo("");
      setConteudo("");
      setTipo("nota");
      setProjetoId("");
      setReuniaoId("");
      setVisibilidade("somente_eu");
      setUsuariosSelecionados([]);
      if (editorRef.current) editorRef.current.innerHTML = "";
      setEditorAberto(false);

      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao criar nota:", error);
      alert("Erro inesperado ao criar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const iniciarEdicao = (nota: Nota) => {
    setEditorAberto(true);
    setEditandoNotaId(nota.nota_id);
    setTitulo(nota.titulo);
    setConteudo(nota.conteudo ?? "");
    setTipo(nota.tipo);
    setProjetoId(nota.projeto_id ?? "");
    setReuniaoId(nota.reuniao_id ?? "");
    setVisibilidade(nota.visibilidade);
    setUsuariosSelecionados((nota.nota_permissoes ?? []).map((item) => item.usuario_id));
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = nota.conteudo ?? "";
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const cancelarEdicaoNota = () => {
    setEditorAberto(false);
    setEditandoNotaId(null);
    setTitulo("");
    setConteudo("");
    setTipo("nota");
    setProjetoId("");
    setReuniaoId("");
    setVisibilidade("somente_eu");
    setUsuariosSelecionados([]);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const salvarEdicaoNota = async () => {
    if (!(await requirePagePermission("operacao_notas", "pode_editar"))) return;
    if (!usuarioAtual || !editandoNotaId) return;
    const conteudoTexto = editorRef.current?.innerText.trim() ?? "";
    if (!titulo.trim()) { alert("Informe o título da nota."); return; }
    try {
      setSalvando(true);
      const { error } = await supabase.from("notas").update({
        projeto_id: projetoId || null,
        reuniao_id: reuniaoId || null,
        titulo: titulo.trim(),
        conteudo: conteudo.trim() || conteudoTexto || null,
        tipo,
        visibilidade,
      }).eq("nota_id", editandoNotaId);
      if (error) { console.error("Erro ao editar nota:", error); alert("Não foi possível salvar a nota."); return; }
      const { error: limparPermissoesError } = await supabase.from("nota_permissoes").delete().eq("nota_id", editandoNotaId);
      if (limparPermissoesError) console.error("Erro ao atualizar permissões:", limparPermissoesError);
      if (visibilidade === "selecionados" && usuariosSelecionados.length > 0) {
        const { error: permissaoError } = await supabase.from("nota_permissoes").insert(usuariosSelecionados.map((usuarioId) => ({ nota_id: editandoNotaId, empresa_id: usuarioAtual.empresa_id, usuario_id: usuarioId })));
        if (permissaoError) console.error("Erro ao salvar permissões:", permissaoError);
      }
      cancelarEdicaoNota();
      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao editar nota:", error);
      alert("Erro inesperado ao editar nota.");
    } finally { setSalvando(false); }
  };

  const iniciarNovaNotaAmpla = () => {
    cancelarEdicaoNota();
    setEditorAberto(true);
  };

  const excluirNota = async (notaId: string) => {
    if (!(await requirePagePermission("operacao_notas", "pode_excluir"))) return;
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
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Operação</p>

            <h1 style={titleStyle}>Notas</h1>

            <p style={descriptionStyle}>
              Registre informações importantes da operação: produto,
              posicionamento, scripts, processos, atas, ideias e estratégias.
            </p>
          </div>

          <div style={topActionsStyle}>
            <a href="/operacao" style={topButtonStyle}>
              Dashboard Operacional
            </a>
            <a href="/operacao/reunioes" style={topButtonStyle}>
              Reuniões
            </a>
          </div>
        </header>

        <section style={layoutGridStyle}>
          {editorAberto && <div style={editorBackdropStyle} onClick={cancelarEdicaoNota} aria-hidden="true" />}
          <aside style={editorAberto ? { ...formCardStyle, ...expandedEditorStyle } : formCardStyle}>
            <div style={formHeaderStyle}>
              <div style={expandedHeaderStyle}>
                <div>
                  <h2 style={formTitleStyle}>{editandoNotaId ? "Editar nota" : "Nova nota"}</h2>
                  {editorAberto && <p style={formDescriptionStyle}>Modo de escrita ampliado para reuniões, ideias e registros detalhados.</p>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {!editorAberto && <button type="button" onClick={iniciarNovaNotaAmpla} style={secondaryButtonStyle}>Abrir editor amplo</button>}
                  {editorAberto && <button type="button" onClick={cancelarEdicaoNota} style={secondaryButtonStyle}>Fechar</button>}
                </div>
              </div>
              <p style={formDescriptionStyle}>
                {editorAberto ? "Preencha os dados da nota e use o espaço livre abaixo para escrever." : "Salve processos, ideias, scripts e registros importantes."}
              </p>
            </div>

            <div style={formGridStyle}>
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
                <label style={labelStyle}>Reunião relacionada</label>
                <select value={reuniaoId} onChange={(event) => setReuniaoId(event.target.value)} style={inputStyle}>
                  <option value="">Sem reunião vinculada</option>
                  {reunioes.map((reuniao) => <option key={reuniao.reuniao_id} value={reuniao.reuniao_id}>{reuniao.titulo}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Quem pode ver</label>
                <select value={visibilidade} onChange={(event) => setVisibilidade(event.target.value as Nota["visibilidade"])} style={inputStyle}>
                  <option value="somente_eu">Somente eu</option>
                  <option value="empresa">Toda a empresa</option>
                  <option value="gerencia">Gerência</option>
                  <option value="selecionados">Membros selecionados</option>
                </select>
              </div>

              {visibilidade === "selecionados" && <div><label style={labelStyle}>Membros autorizados</label><div style={permissionBoxStyle}>{membrosEquipe.length === 0 ? <span style={helperTextStyle}>Nenhum membro ativo cadastrado.</span> : membrosEquipe.map((membro) => membro.usuario_id ? <label key={membro.membro_id} style={permissionOptionStyle}><input type="checkbox" checked={usuariosSelecionados.includes(membro.usuario_id)} onChange={(event) => setUsuariosSelecionados((lista) => event.target.checked ? [...lista, membro.usuario_id as string] : lista.filter((id) => id !== membro.usuario_id))} /><span>{membro.nome}{membro.cargo ? ` — ${membro.cargo}` : ""}</span></label> : null)}</div></div>}

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
                <label style={labelStyle}>Conteúdo livre</label>
                <div style={editorToolbarStyle} aria-label="Ferramentas de formatação">
                  <button type="button" onClick={() => formatarEditor("bold")} style={toolbarButtonStyle}><strong>B</strong></button>
                  <button type="button" onClick={() => formatarEditor("italic")} style={toolbarButtonStyle}><em>I</em></button>
                  <button type="button" onClick={() => formatarEditor("underline")} style={toolbarButtonStyle}><u>U</u></button>
                  <label style={colorPickerStyle} title="Cor do texto">
                    <span style={{ color: "#64748b", fontSize: "12px" }}>Cor</span>
                    <input type="color" defaultValue="#0f172a" onChange={(event) => formatarEditor("foreColor", event.target.value)} />
                  </label>
                  {['💡', '✅', '📌', '🚧', '⭐'].map((emoji) => <button key={emoji} type="button" onClick={() => inserirEmoji(emoji)} style={toolbarButtonStyle}>{emoji}</button>)}
                  <button type="button" onClick={() => formatarEditor("removeFormat")} style={clearButtonStyle}>Limpar formato</button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  onInput={(event) => setConteudo(event.currentTarget.innerHTML)}
                  data-placeholder="Escreva livremente: texto, ideias, decisões e observações..."
                  style={editorAberto ? { ...richEditorStyle, minHeight: "clamp(360px, 58vh, 680px)" } : richEditorStyle}
                />
                <p style={helperTextStyle}>Use a barra para destacar ideias e organizar a nota. O conteúdo continua salvo na mesma nota.</p>
              </div>

              {editandoNotaId && <button type="button" onClick={cancelarEdicaoNota} style={secondaryButtonStyle}>Cancelar edição</button>}
              <button
                type="button"
                onClick={editandoNotaId ? salvarEdicaoNota : criarNota}
                disabled={salvando}
                style={{
                  ...submitButtonStyle,
                  cursor: salvando ? "not-allowed" : "pointer",
                  opacity: salvando ? 0.75 : 1,
                }}
              >
                {salvando ? "Salvando..." : editandoNotaId ? "Salvar alterações" : "+ Criar nota"}
              </button>
            </div>
          </aside>

          <section style={libraryStyle}>
            <div style={libraryHeaderStyle}>
              <div>
                <h2 style={libraryTitleStyle}>Biblioteca de notas</h2>
                <p style={libraryDescriptionStyle}>
                  {notasFiltradas.length} nota(s) encontrada(s)
                </p>
              </div>
            </div>

            <div style={filtersStyle}>
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar nota..."
                style={{
                  ...inputStyle,
                  background: "white",
                }}
              />

              <select
                value={tipoFiltro}
                onChange={(event) => setTipoFiltro(event.target.value)}
                style={{
                  ...inputStyle,
                  background: "white",
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
                }}
              >
                <option value="todos">Todos os projetos</option>
                {projetos.map((projeto) => (
                  <option key={projeto.projeto_id} value={projeto.projeto_id}>
                    {projeto.nome}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div style={emptyStateStyle}>Carregando notas...</div>
            ) : notasFiltradas.length === 0 ? (
              <div style={emptyStateStyle}>Nenhuma nota encontrada.</div>
            ) : (
              <div style={notesListStyle}>
                {notasFiltradas.map((nota) => (
                  <article
                    key={nota.nota_id}
                    style={{
                      ...noteCardStyle,
                      borderLeft: getBorderByTipo(nota.tipo),
                    }}
                  >
                    <div style={noteHeaderStyle}>
                      <div>
                        <div style={badgeRowStyle}>
                          <Badge text={formatarTipo(nota.tipo)} />
                          {nota.projetos?.nome && (
                            <Badge text={`Projeto: ${nota.projetos.nome}`} />
                          )}
                          <Badge text={formatarVisibilidade(nota.visibilidade)} />
                          {nota.reunioes?.titulo && <Badge text={`Reunião: ${nota.reunioes.titulo}`} />}
                          <Badge text={formatarDataHora(nota.criado_em)} />
                        </div>

                        <h3 style={noteTitleStyle}>{nota.titulo}</h3>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="button" onClick={() => iniciarEdicao(nota)} style={secondaryButtonStyle}>Editar</button>
                        <button type="button" onClick={() => excluirNota(nota.nota_id)} style={deleteButtonStyle}>Excluir</button>
                      </div>
                    </div>

                    {nota.conteudo && <div style={noteContentStyle} dangerouslySetInnerHTML={{ __html: sanitizarConteudo(nota.conteudo) }} />}
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
  const lower = text.toLowerCase();

  let background = "#f1f5f9";
  let color = "#475569";

  if (lower.includes("estratégia")) {
    background = "#ede9fe";
    color = "#6d28d9";
  }

  if (lower.includes("processo")) {
    background = "#dcfce7";
    color = "#166534";
  }

  if (lower.includes("script")) {
    background = "#dbeafe";
    color = "#1d4ed8";
  }

  if (lower.includes("ata")) {
    background = "#fed7aa";
    color = "#c2410c";
  }

  if (lower.includes("ideia")) {
    background = "#fce7f3";
    color = "#be185d";
  }

  if (lower.includes("produto")) {
    background = "#cffafe";
    color = "#0f766e";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        background,
        color,
        fontSize: "11px",
        fontWeight: 800,
        padding: "5px 10px",
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

function formatarVisibilidade(visibilidade: Nota["visibilidade"]) {
  return { somente_eu: "Somente eu", empresa: "Toda a empresa", gerencia: "Gerência", selecionados: "Membros selecionados" }[visibilidade] ?? "Somente eu";
}

function sanitizarConteudo(conteudo: string) {
  if (!conteudo.includes("<")) {
    return conteudo.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] ?? char)).replace(/\n/g, "<br />");
  }

  return conteudo
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<(?!\/?(b|strong|i|em|u|br|p|div|ul|ol|li|span)(?:\s[^>]*)?>)[^>]*>/gi, "");
}

function formatarEditor(comando: string, valor?: string) {
  document.execCommand(comando, false, valor);
}

function inserirEmoji(emoji: string) {
  document.execCommand("insertText", false, emoji);
}

function getBorderByTipo(tipo: Nota["tipo"]) {
  if (tipo === "estrategia") return "4px solid #6d28d9";
  if (tipo === "processo") return "4px solid #16a34a";
  if (tipo === "script") return "4px solid #2563eb";
  if (tipo === "ata") return "4px solid #ea580c";
  if (tipo === "ideia") return "4px solid #db2777";
  if (tipo === "produto") return "4px solid #0f766e";
  return "4px solid #14b8a6";
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "28px",
  color: "#111827",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "flex-start",
  marginBottom: "22px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: "12px",
  color: "#0f766e",
  fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

const descriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6b7280",
  fontSize: "14px",
  maxWidth: "720px",
  lineHeight: 1.5,
};

const topActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const topButtonStyle: React.CSSProperties = {
  color: "#0f172a",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "9px 12px",
  fontSize: "13px",
  textDecoration: "none",
  fontWeight: 800,
};

const layoutGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: "32px",
  alignItems: "flex-start",
};

const formCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
};

const formHeaderStyle: React.CSSProperties = {
  marginBottom: "16px",
};

const formTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 900,
};

const formDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
};

const libraryStyle: React.CSSProperties = {
  minWidth: 0,
};

const libraryHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  marginBottom: "14px",
};

const libraryTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 900,
};

const libraryDescriptionStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "13px",
  color: "#64748b",
};

const filtersStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 180px 220px",
  gap: "12px",
  marginBottom: "16px",
  alignItems: "center",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 800,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const submitButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 14px",
  background: "linear-gradient(to right, #0f766e, #14b8a6)",
  color: "white",
  fontSize: "14px",
  fontWeight: 900,
};

const notesListStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
};

const noteCardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "16px 18px",
  boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
  transition: "all 0.2s ease",
};

const noteHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "10px",
};

const noteTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 900,
};

const noteContentStyle: React.CSSProperties = {
  margin: "12px 0 0",
  whiteSpace: "pre-wrap",
  color: "#475569",
  fontSize: "13px",
  lineHeight: 1.65,
};

const deleteButtonStyle: React.CSSProperties = {
  border: "1px solid #fee2e2",
  borderRadius: "10px",
  background: "#fff",
  color: "#dc2626",
  padding: "8px 10px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "white",
  color: "#0f766e",
  padding: "8px 10px",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
};

const permissionBoxStyle: React.CSSProperties = { display: "grid", gap: "6px", border: "1px solid #d1d5db", borderRadius: "10px", padding: "8px", background: "#f8fafc" };
const permissionOptionStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "8px", padding: "7px", borderRadius: "8px", background: "white", color: "#334155", fontSize: "13px" };
const helperTextStyle: React.CSSProperties = { color: "#64748b", fontSize: "12px" };

const editorToolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  border: "1px solid #d1d5db",
  borderBottom: "none",
  borderRadius: "12px 12px 0 0",
  padding: "8px",
  background: "#f8fafc",
};

const toolbarButtonStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "white",
  color: "#0f172a",
  minWidth: "30px",
  height: "30px",
  cursor: "pointer",
  fontSize: "14px",
};

const clearButtonStyle: React.CSSProperties = {
  ...toolbarButtonStyle,
  padding: "0 8px",
  fontSize: "11px",
  color: "#64748b",
};

const colorPickerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  height: "30px",
  padding: "0 5px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "white",
};

const richEditorStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "190px",
  maxHeight: "420px",
  overflowY: "auto",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const editorBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 40,
  background: "rgba(15, 23, 42, 0.42)",
  backdropFilter: "blur(2px)",
};

const expandedEditorStyle: React.CSSProperties = {
  position: "fixed",
  inset: "24px",
  zIndex: 50,
  overflowY: "auto",
  maxHeight: "calc(100vh - 48px)",
  width: "auto",
  padding: "28px clamp(20px, 4vw, 64px)",
  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.28)",
};

const expandedHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
};

const emptyStateStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "32px",
  textAlign: "center",
  color: "#6b7280",
  fontSize: "14px",
};
