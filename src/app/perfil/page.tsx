"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabaseClient";

type PerfilUsuario = {
  usuario_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  whatsapp: string | null;
  tipo_documento: string | null;
  documento: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  codigo_vinculo: string;
};

type VinculoUsuario = {
  empresa_id: string;
  perfil: string;
  status: string | null;
  empresas: {
    nome: string;
  } | null;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export default function PerfilPage() {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [documento, setDocumento] = useState("");

  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [codigoVinculo, setCodigoVinculo] = useState("");
  const [vinculo, setVinculo] = useState<VinculoUsuario | null>(null);

  const onlyDigits = (value: string) => value.replace(/\D/g, "");

  const formatPhone = (value: string) => {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatCpf = (value: string) => {
    return onlyDigits(value)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCnpj = (value: string) => {
    return onlyDigits(value)
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatDocumento = (value: string, tipo: string) => {
    if (tipo === "cpf") return formatCpf(value);
    if (tipo === "cnpj") return formatCnpj(value);
    return value;
  };

  const formatCep = (value: string) => {
    return onlyDigits(value)
      .slice(0, 8)
      .replace(/^(\d{5})(\d)/, "$1-$2");
  };

  const formatPerfil = (value: string) => {
    if (value === "admin") return "Admin";
    if (value === "suporte") return "Suporte";
    if (value === "terceirizado") return "Terceirizado";
    return value;
  };

  const loadPerfil = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      setUsuarioId(session.user.id);

      const { data, error } = await supabase
        .from("perfis_usuario")
        .select(
          "usuario_id, nome, email, telefone, whatsapp, tipo_documento, documento, cep, endereco, numero, complemento, bairro, cidade, estado, codigo_vinculo"
        )
        .eq("usuario_id", session.user.id)
        .single<PerfilUsuario>();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        alert("Não foi possível carregar seu perfil.");
        return;
      }

      setNome(data.nome || "");
      setEmail(data.email || session.user.email || "");
      setTelefone(formatPhone(data.telefone || ""));
      setWhatsapp(formatPhone(data.whatsapp || ""));
      setTipoDocumento(data.tipo_documento || "");
      setDocumento(formatDocumento(data.documento || "", data.tipo_documento || ""));
      setCep(formatCep(data.cep || ""));
      setEndereco(data.endereco || "");
      setNumero(data.numero || "");
      setComplemento(data.complemento || "");
      setBairro(data.bairro || "");
      setCidade(data.cidade || "");
      setEstado(data.estado || "");
      setCodigoVinculo(data.codigo_vinculo || "");

      const { data: vinculoData, error: vinculoError } = await supabase
        .from("usuarios")
        .select("empresa_id, perfil, status, empresas(nome)")
        .eq("usuario_id", session.user.id)
        .maybeSingle<VinculoUsuario>();

      if (vinculoError) {
        console.error("Erro ao buscar vínculo:", vinculoError);
        setVinculo(null);
      } else {
        setVinculo(vinculoData || null);
      }
    } catch (err) {
      console.error("Erro inesperado ao carregar perfil:", err);
      alert("Erro de conexão ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(loadPerfil, 300);
  }, []);

  const handleTipoDocumentoChange = (value: string) => {
    setTipoDocumento(value);
    setDocumento("");
  };

  const handleDocumentoChange = (value: string) => {
    setDocumento(formatDocumento(value, tipoDocumento));
  };

  const buscarCep = async (cepValue: string) => {
    const cepLimpo = onlyDigits(cepValue);

    if (cepLimpo.length !== 8) return;

    try {
      setLoadingCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = (await response.json()) as ViaCepResponse;

      if (data.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setEndereco(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
      setComplemento((prev) => prev || data.complemento || "");
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
      alert("Não foi possível buscar o CEP.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);

    if (onlyDigits(formatted).length === 8) {
      buscarCep(formatted);
    }
  };

  const handleCopyCodigo = async () => {
    if (!codigoVinculo) return;

    try {
      await navigator.clipboard.writeText(codigoVinculo);
      alert("Código copiado.");
    } catch {
      alert("Não foi possível copiar o código.");
    }
  };

  const validateForm = () => {
    if (!nome.trim()) {
      alert("Informe seu nome.");
      return false;
    }

    const telefoneLimpo = onlyDigits(telefone);
    const whatsappLimpo = onlyDigits(whatsapp);
    const documentoLimpo = onlyDigits(documento);
    const cepLimpo = onlyDigits(cep);

    if (telefoneLimpo && telefoneLimpo.length < 10) {
      alert("Telefone inválido. Use DDD + número.");
      return false;
    }

    if (whatsappLimpo && whatsappLimpo.length < 10) {
      alert("WhatsApp inválido. Use DDD + número.");
      return false;
    }

    if (tipoDocumento === "cpf" && documentoLimpo.length !== 11) {
      alert("CPF inválido. Informe 11 dígitos.");
      return false;
    }

    if (tipoDocumento === "cnpj" && documentoLimpo.length !== 14) {
      alert("CNPJ inválido. Informe 14 dígitos.");
      return false;
    }

    if (cepLimpo && cepLimpo.length !== 8) {
      alert("CEP inválido. Informe 8 dígitos.");
      return false;
    }

    return true;
  };

  const handleSavePerfil = async () => {
    if (!usuarioId) {
      alert("Usuário não encontrado.");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("perfis_usuario")
        .update({
          nome: nome.trim(),
          telefone: onlyDigits(telefone) || null,
          whatsapp: onlyDigits(whatsapp) || null,
          tipo_documento: tipoDocumento || null,
          documento: onlyDigits(documento) || null,
          cep: onlyDigits(cep) || null,
          endereco: endereco.trim() || null,
          numero: numero.trim() || null,
          complemento: complemento.trim() || null,
          bairro: bairro.trim() || null,
          cidade: cidade.trim() || null,
          estado: estado.trim().toUpperCase() || null,
        })
        .eq("usuario_id", usuarioId);

      if (error) {
        console.error("Erro ao salvar perfil:", error);
        alert(error.message);
        return;
      }

      alert("Perfil atualizado com sucesso.");
      await loadPerfil();
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
      alert("Erro de conexão ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div>
        <div style={pageHeader}>
          <div>
            <h1 style={title}>Meu Perfil</h1>
            <p style={subtitle}>
              Complete seus dados e use seu código para ser vinculado a uma empresa.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={card}>
            <div style={emptyState}>Carregando perfil...</div>
          </div>
        ) : (
          <div style={layoutGrid}>
            <div style={sideColumn}>
              <div style={card}>
                <div style={sectionTitle}>Código de vínculo</div>

                <div style={codigoBox}>
                  <div>
                    <div style={codigoLabel}>Seu código</div>
                    <div style={codigoValue}>{codigoVinculo || "-"}</div>
                  </div>

                  <button onClick={handleCopyCodigo} style={copyButton}>
                    Copiar
                  </button>
                </div>

                <p style={helperText}>
                  Envie este código para o administrador da empresa vincular seu acesso.
                </p>
              </div>

              <div style={card}>
                <div style={sectionTitle}>Vínculo com empresa</div>

                {vinculo ? (
                  <div style={vinculoBox}>
                    <div>
                      <div style={codigoLabel}>Empresa</div>
                      <div style={vinculoEmpresa}>
                        {vinculo.empresas?.nome || "Empresa não encontrada"}
                      </div>
                    </div>

                    <div style={vinculoBadges}>
                      <span style={perfilBadge(vinculo.perfil)}>
                        {formatPerfil(vinculo.perfil)}
                      </span>

                      <span style={statusBadge(vinculo.status || "ativo")}>
                        {vinculo.status === "inativo" ? "Inativo" : "Ativo"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={semVinculoBox}>
                    <div style={semVinculoTitle}>Ainda sem empresa vinculada</div>
                    <div style={semVinculoText}>
                      Envie seu código de vínculo para o administrador da empresa.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>Dados principais</div>

              <div style={formGrid}>
                <div style={fieldFull}>
                  <label style={labelStyle}>Nome completo *</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldFull}>
                  <label style={labelStyle}>E-mail</label>
                  <input value={email} disabled style={disabledInputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Telefone</label>
                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tipo documento</label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => handleTipoDocumentoChange(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Não informado</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Documento</label>
                  <input
                    value={documento}
                    onChange={(e) => handleDocumentoChange(e.target.value)}
                    placeholder={
                      tipoDocumento === "cpf"
                        ? "000.000.000-00"
                        : tipoDocumento === "cnpj"
                        ? "00.000.000/0000-00"
                        : "CPF ou CNPJ"
                    }
                    disabled={!tipoDocumento}
                    style={tipoDocumento ? inputStyle : disabledInputStyle}
                  />
                </div>
              </div>

              <div style={sectionTitle}>Endereço</div>

              <div style={formGrid}>
                <div>
                  <label style={labelStyle}>CEP</label>
                  <input
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    style={inputStyle}
                  />
                  <div style={helperText}>
                    {loadingCep
                      ? "Buscando CEP..."
                      : "Ao preencher 8 dígitos, busca automático."}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Estado</label>
                  <input
                    value={estado}
                    onChange={(e) =>
                      setEstado(e.target.value.toUpperCase().slice(0, 2))
                    }
                    placeholder="UF"
                    style={inputStyle}
                  />
                </div>

                <div style={fieldFull}>
                  <label style={labelStyle}>Endereço</label>
                  <input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua / Avenida"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Número</label>
                  <input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Número"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Complemento</label>
                  <input
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Apto, sala, bloco..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Bairro</label>
                  <input
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Bairro"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Cidade</label>
                  <input
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={footer}>
                <button
                  onClick={handleSavePerfil}
                  disabled={saving || loadingCep}
                  style={primaryButton}
                >
                  {saving ? "Salvando..." : "Salvar perfil"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const pageHeader = {
  marginBottom: "16px",
};

const title = {
  fontSize: "22px",
  fontWeight: 700,
  margin: 0,
};

const subtitle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
};

const layoutGrid = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  gap: "16px",
  alignItems: "start",
};

const sideColumn = {
  display: "grid",
  gap: "16px",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
};

const sectionTitle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 12px",
};

const codigoBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const codigoLabel = {
  fontSize: "10px",
  color: "#6b7280",
  marginBottom: "4px",
  fontWeight: 600,
};

const codigoValue = {
  fontSize: "20px",
  fontWeight: 800,
  letterSpacing: "1px",
  color: "#0f766e",
};

const vinculoBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  display: "grid",
  gap: "10px",
};

const vinculoEmpresa = {
  fontSize: "14px",
  color: "#111827",
  fontWeight: 700,
};

const vinculoBadges = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const semVinculoBox = {
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "10px",
  padding: "12px",
};

const semVinculoTitle = {
  fontSize: "12px",
  color: "#92400e",
  fontWeight: 700,
};

const semVinculoText = {
  fontSize: "11px",
  color: "#92400e",
  marginTop: "4px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "16px",
};

const fieldFull = {
  gridColumn: "1 / -1",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  color: "#374151",
  marginBottom: "4px",
};

const inputStyle = {
  width: "100%",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  fontSize: "13px",
  boxSizing: "border-box" as const,
  background: "white",
};

const disabledInputStyle = {
  ...inputStyle,
  background: "#f3f4f6",
  color: "#6b7280",
  cursor: "not-allowed",
};

const helperText = {
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "4px",
};

const footer = {
  display: "flex",
  justifyContent: "flex-end",
};

const primaryButton = {
  background: "#14b8a6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const copyButton = {
  background: "white",
  color: "#0f766e",
  border: "1px solid #99f6e4",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyState = {
  fontSize: "12px",
  color: "#6b7280",
};

function perfilBadge(perfil: string) {
  if (perfil === "admin") {
    return {
      background: "#dbeafe",
      color: "#1d4ed8",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 700,
    };
  }

  if (perfil === "terceirizado") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 700,
    };
  }

  return {
    background: "#ccfbf1",
    color: "#0f766e",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 700,
  };
}

function statusBadge(status: string) {
  if (status === "ativo") {
    return {
      background: "#dcfce7",
      color: "#166534",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 700,
    };
  }

  return {
    background: "#e5e7eb",
    color: "#6b7280",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 700,
  };
}