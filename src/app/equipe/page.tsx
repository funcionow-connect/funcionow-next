"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabaseClient";

type UsuarioEmpresa = {
  empresa_id: string;
  perfil: string | null;
  perfil_acesso_id: string | null;
};

type MembroEquipe = {
  membro_id: string;
  empresa_id: string;
  usuario_id: string | null;
  nome: string;
  tipo_membro: string;
  cargo: string | null;
  status: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  tipo_documento: string | null;
  documento: string | null;
  razao_social: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  chave_pix: string | null;
  observacoes: string | null;
  criado_em: string;
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

type PerfilVinculoBusca = {
  usuario_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  whatsapp: string | null;
  tipo_documento: string | null;
  documento: string | null;
  cidade: string | null;
  estado: string | null;
  codigo_vinculo: string;
};

type PerfilAcessoOption = {
  perfil_acesso_id: string;
  nome: string;
  slug: string;
  is_admin: boolean;
  ativo: boolean;
};

type PermissaoEquipe = {
  pode_acessar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

export default function EquipePage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [membros, setMembros] = useState<MembroEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const [podeCriar, setPodeCriar] = useState(false);
  const [podeEditar, setPodeEditar] = useState(false);
  const [podeExcluir, setPodeExcluir] = useState(false);

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const [openModal, setOpenModal] = useState(false);
  const [editingMembroId, setEditingMembroId] = useState<string | null>(null);
  const [selectedMembro, setSelectedMembro] = useState<MembroEquipe | null>(null);

  const [codigoVinculo, setCodigoVinculo] = useState("");
  const [perfilVinculoId, setPerfilVinculoId] = useState("");
  const [linkingUser, setLinkingUser] = useState(false);

  const [perfisAcesso, setPerfisAcesso] = useState<PerfilAcessoOption[]>([]);
  const [perfilAcessoAtualId, setPerfilAcessoAtualId] = useState("");
  const [perfilAcessoEditId, setPerfilAcessoEditId] = useState("");
  const [savingPerfilAcesso, setSavingPerfilAcesso] = useState(false);

  const [openVincularModal, setOpenVincularModal] = useState(false);
  const [codigoNovoVinculo, setCodigoNovoVinculo] = useState("");
  const [perfilEncontrado, setPerfilEncontrado] =
    useState<PerfilVinculoBusca | null>(null);
  const [buscandoPerfil, setBuscandoPerfil] = useState(false);
  const [criandoVinculo, setCriandoVinculo] = useState(false);

  const [novoTipoMembro, setNovoTipoMembro] = useState("colaborador");
  const [novoPerfilAcessoId, setNovoPerfilAcessoId] = useState("");
  const [novoCargo, setNovoCargo] = useState("");
  const [novaChavePix, setNovaChavePix] = useState("");
  const [novaObservacao, setNovaObservacao] = useState("");

  const [nome, setNome] = useState("");
  const [tipoMembro, setTipoMembro] = useState("colaborador");
  const [cargo, setCargo] = useState("");
  const [status, setStatus] = useState("ativo");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [documento, setDocumento] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");

  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [chavePix, setChavePix] = useState("");
  const [observacoes, setObservacoes] = useState("");

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

  const formatStoredPhone = (value: string | null) => {
    if (!value) return "";
    return formatPhone(value);
  };

  const formatStoredDocumento = (value: string | null, tipo: string | null) => {
    if (!value) return "";
    return formatDocumento(value, tipo || "");
  };

  const getPerfilPadraoId = (lista: PerfilAcessoOption[], slug = "operacional") => {
    const perfilPadrao = lista.find((perfil) => perfil.slug === slug);
    const operacional = lista.find((perfil) => perfil.slug === "operacional");
    const primeiro = lista[0];

    return (
      perfilPadrao?.perfil_acesso_id ||
      operacional?.perfil_acesso_id ||
      primeiro?.perfil_acesso_id ||
      ""
    );
  };

  const getLegacyPerfilByPerfilAcessoId = (perfilAcessoId: string) => {
    const perfil = perfisAcesso.find(
      (item) => item.perfil_acesso_id === perfilAcessoId,
    );

    if (perfil?.slug === "admin") return "admin";
    if (perfil?.slug === "externo") return "terceirizado";

    return "suporte";
  };

  const getNomePerfilAcesso = (perfilAcessoId: string) => {
    const perfil = perfisAcesso.find(
      (item) => item.perfil_acesso_id === perfilAcessoId,
    );

    return perfil?.nome || "-";
  };

  const setPermissoesFallback = (perfil: string | null) => {
    const isAdmin = perfil === "admin";

    setPodeCriar(isAdmin);
    setPodeEditar(isAdmin);
    setPodeExcluir(isAdmin);
  };

  const loadPermissoesEquipe = async (
    perfilAcessoId: string | null,
    perfilLegado: string | null,
  ) => {
    if (!perfilAcessoId) {
      setPermissoesFallback(perfilLegado);
      return;
    }

    const { data, error } = await supabase
      .from("perfil_acesso_permissoes")
      .select("pode_acessar, pode_criar, pode_editar, pode_excluir")
      .eq("perfil_acesso_id", perfilAcessoId)
      .eq("pagina_key", "equipe")
      .maybeSingle<PermissaoEquipe>();

    if (error) {
      console.error("Erro ao buscar permissões da equipe:", error);
      setPermissoesFallback(perfilLegado);
      return;
    }

    setPodeCriar(Boolean(data?.pode_criar));
    setPodeEditar(Boolean(data?.pode_editar));
    setPodeExcluir(Boolean(data?.pode_excluir));
  };

  const loadPage = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setMembros([]);
        setLoading(false);
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("empresa_id, perfil, perfil_acesso_id")
        .eq("usuario_id", session.user.id)
        .single<UsuarioEmpresa>();

      if (usuarioError || !usuario?.empresa_id) {
        console.error("Erro ao buscar empresa:", usuarioError);
        setMembros([]);
        setLoading(false);
        return;
      }

      setEmpresaId(usuario.empresa_id);

      await loadPermissoesEquipe(usuario.perfil_acesso_id, usuario.perfil);

      const { data: perfisData, error: perfisError } = await supabase
        .from("perfis_acesso")
        .select("perfil_acesso_id, nome, slug, is_admin, ativo")
        .eq("empresa_id", usuario.empresa_id)
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (perfisError) {
        console.error("Erro ao buscar perfis de acesso:", perfisError);
        setPerfisAcesso([]);
      } else {
        const listaPerfis = (perfisData as PerfilAcessoOption[]) || [];
        const perfilPadrao = getPerfilPadraoId(listaPerfis);

        setPerfisAcesso(listaPerfis);
        setNovoPerfilAcessoId((prev) => prev || perfilPadrao);
        setPerfilVinculoId((prev) => prev || perfilPadrao);
      }

      const { data, error } = await supabase
        .from("membros_equipe")
        .select(
          "membro_id, empresa_id, usuario_id, nome, tipo_membro, cargo, status, email, telefone, whatsapp, tipo_documento, documento, razao_social, cep, endereco, numero, complemento, bairro, cidade, estado, chave_pix, observacoes, criado_em",
        )
        .eq("empresa_id", usuario.empresa_id)
        .order("criado_em", { ascending: false });

      if (error) {
        console.error("Erro ao buscar membros:", error);
        setMembros([]);
        return;
      }

      setMembros((data as MembroEquipe[]) || []);
    } catch (err) {
      console.error("Erro inesperado ao carregar equipe:", err);
      alert("Erro de conexão ao carregar equipe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(loadPage, 300);
  }, []);

  const resetForm = () => {
    setEditingMembroId(null);
    setNome("");
    setTipoMembro("colaborador");
    setCargo("");
    setStatus("ativo");
    setEmail("");
    setTelefone("");
    setWhatsapp("");
    setTipoDocumento("");
    setDocumento("");
    setRazaoSocial("");
    setCep("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setChavePix("");
    setObservacoes("");
  };

  const resetVincularModal = () => {
    const perfilPadrao = getPerfilPadraoId(perfisAcesso);

    setCodigoNovoVinculo("");
    setPerfilEncontrado(null);
    setNovoTipoMembro("colaborador");
    setNovoPerfilAcessoId(perfilPadrao);
    setNovoCargo("");
    setNovaChavePix("");
    setNovaObservacao("");
  };

  const handleOpenVincularModal = () => {
    if (!podeCriar) {
      alert("Você não tem permissão para criar vínculos na equipe.");
      return;
    }

    resetVincularModal();
    setOpenVincularModal(true);
  };

  const handleCloseVincularModal = () => {
    resetVincularModal();
    setOpenVincularModal(false);
  };

  const handleBuscarPerfilPorCodigo = async () => {
    if (!codigoNovoVinculo.trim()) {
      alert("Informe o código de vínculo.");
      return;
    }

    try {
      setBuscandoPerfil(true);
      setPerfilEncontrado(null);

      const { data, error } = await supabase.rpc(
        "buscar_perfil_por_codigo_vinculo",
        {
          p_codigo: codigoNovoVinculo.trim(),
        },
      );

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        alert(error.message);
        return;
      }

      const perfil = Array.isArray(data) ? data[0] : data;

      if (!perfil) {
        alert("Nenhum usuário encontrado com este código.");
        return;
      }

      setPerfilEncontrado(perfil as PerfilVinculoBusca);
    } catch (err) {
      console.error("Erro inesperado ao buscar perfil:", err);
      alert("Erro de conexão ao buscar perfil.");
    } finally {
      setBuscandoPerfil(false);
    }
  };

  const handleCriarMembroPorCodigo = async () => {
    if (!podeCriar) {
      alert("Você não tem permissão para criar vínculos na equipe.");
      return;
    }

    if (!perfilEncontrado) {
      alert("Busque um perfil antes de vincular.");
      return;
    }

    if (!novoPerfilAcessoId) {
      alert("Selecione um perfil de acesso.");
      return;
    }

    try {
      setCriandoVinculo(true);

      const { error } = await supabase.rpc("criar_membro_por_codigo", {
        p_codigo_vinculo: codigoNovoVinculo.trim(),
        p_tipo_membro: novoTipoMembro,
        p_cargo: novoCargo.trim() || null,
        p_perfil: getLegacyPerfilByPerfilAcessoId(novoPerfilAcessoId),
        p_status: "ativo",
        p_chave_pix: novaChavePix.trim() || null,
        p_observacoes: novaObservacao.trim() || null,
      });

      if (error) {
        console.error("Erro ao criar membro por código:", error);
        alert(error.message);
        return;
      }

      alert("Usuário vinculado e membro criado com sucesso.");

      handleCloseVincularModal();
      await loadPage();
    } catch (err) {
      console.error("Erro inesperado ao criar vínculo:", err);
      alert("Erro de conexão ao criar vínculo.");
    } finally {
      setCriandoVinculo(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (!podeCriar) {
      alert("Você não tem permissão para cadastrar membros.");
      return;
    }

    resetForm();
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setOpenModal(false);
  };

  const handleOpenDetailModal = async (membro: MembroEquipe) => {
    setSelectedMembro(membro);
    setPerfilAcessoAtualId("");
    setPerfilAcessoEditId("");

    if (!membro.usuario_id) return;

    const { data, error } = await supabase
      .from("usuarios")
      .select("perfil_acesso_id")
      .eq("usuario_id", membro.usuario_id)
      .maybeSingle<{ perfil_acesso_id: string | null }>();

    if (error) {
      console.error("Erro ao buscar perfil de acesso:", error);
      return;
    }

    if (data?.perfil_acesso_id) {
      setPerfilAcessoAtualId(data.perfil_acesso_id);
      setPerfilAcessoEditId(data.perfil_acesso_id);
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedMembro(null);
    setCodigoVinculo("");
    setPerfilVinculoId("");
    setPerfilAcessoAtualId("");
    setPerfilAcessoEditId("");
  };

  const handleEditFromDetail = () => {
    if (!selectedMembro) return;

    if (!podeEditar) {
      alert("Você não tem permissão para editar membros.");
      return;
    }

    const membroParaEditar = selectedMembro;
    setSelectedMembro(null);
    handleOpenEditModal(membroParaEditar);
  };

  const handleAtualizarPerfilAcesso = async () => {
    if (!podeEditar) {
      alert("Você não tem permissão para alterar perfil de acesso.");
      return;
    }

    if (!selectedMembro) return;

    if (!selectedMembro.usuario_id) {
      alert("Este membro ainda não possui usuário vinculado.");
      return;
    }

    if (!perfilAcessoEditId) {
      alert("Selecione um perfil de acesso.");
      return;
    }

    try {
      setSavingPerfilAcesso(true);

      const { error } = await supabase.rpc("atualizar_perfil_acesso_membro", {
        p_membro_id: selectedMembro.membro_id,
        p_perfil_acesso_id: perfilAcessoEditId,
      });

      if (error) {
        console.error("Erro ao atualizar perfil de acesso:", error);
        alert(error.message);
        return;
      }

      alert("Perfil de acesso atualizado com sucesso.");

      setPerfilAcessoAtualId(perfilAcessoEditId);
      await loadPage();
    } catch (err) {
      console.error("Erro inesperado ao atualizar perfil de acesso:", err);
      alert("Erro de conexão ao atualizar perfil de acesso.");
    } finally {
      setSavingPerfilAcesso(false);
    }
  };

  const handleVincularUsuario = async () => {
    if (!podeEditar) {
      alert("Você não tem permissão para vincular usuário a membro existente.");
      return;
    }

    if (!selectedMembro) return;

    if (!codigoVinculo.trim()) {
      alert("Informe o código de vínculo.");
      return;
    }

    if (!perfilVinculoId) {
      alert("Selecione um perfil de acesso.");
      return;
    }

    try {
      setLinkingUser(true);

      const { error } = await supabase.rpc("vincular_membro_por_codigo", {
        p_membro_id: selectedMembro.membro_id,
        p_codigo_vinculo: codigoVinculo.trim(),
        p_perfil: getLegacyPerfilByPerfilAcessoId(perfilVinculoId),
      });

      if (error) {
        console.error("Erro ao vincular usuário:", error);
        alert(error.message);
        return;
      }

      alert("Usuário vinculado com sucesso.");

      setSelectedMembro(null);
      setCodigoVinculo("");
      setPerfilVinculoId("");

      await loadPage();
    } catch (err) {
      console.error("Erro inesperado ao vincular usuário:", err);
      alert("Erro de conexão ao vincular usuário.");
    } finally {
      setLinkingUser(false);
    }
  };

  const getEnderecoCompleto = (membro: MembroEquipe) => {
    const partes = [
      membro.endereco,
      membro.numero,
      membro.complemento,
      membro.bairro,
      membro.cidade,
      membro.estado,
      membro.cep ? formatCep(membro.cep) : null,
    ].filter(Boolean);

    return partes.length > 0 ? partes.join(", ") : "-";
  };

  const handleOpenEditModal = (membro: MembroEquipe) => {
    if (!podeEditar) {
      alert("Você não tem permissão para editar membros.");
      return;
    }

    setEditingMembroId(membro.membro_id);
    setNome(membro.nome || "");
    setTipoMembro(membro.tipo_membro || "colaborador");
    setCargo(membro.cargo || "");
    setStatus(membro.status || "ativo");
    setEmail(membro.email || "");
    setTelefone(formatStoredPhone(membro.telefone));
    setWhatsapp(formatStoredPhone(membro.whatsapp));
    setTipoDocumento(membro.tipo_documento || "");
    setDocumento(
      formatStoredDocumento(membro.documento, membro.tipo_documento),
    );
    setRazaoSocial(membro.razao_social || "");
    setCep(formatCep(membro.cep || ""));
    setEndereco(membro.endereco || "");
    setNumero(membro.numero || "");
    setComplemento(membro.complemento || "");
    setBairro(membro.bairro || "");
    setCidade(membro.cidade || "");
    setEstado(membro.estado || "");
    setChavePix(membro.chave_pix || "");
    setObservacoes(membro.observacoes || "");
    setOpenModal(true);
  };

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

      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
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

    const digits = onlyDigits(formatted);
    if (digits.length === 8) {
      buscarCep(formatted);
    }
  };

  const validateForm = () => {
    if (!empresaId) {
      alert("Empresa não encontrada.");
      return false;
    }

    if (!nome.trim()) {
      alert("Digite o nome do membro.");
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

  const getPayload = () => {
    return {
      nome: nome.trim(),
      tipo_membro: tipoMembro,
      cargo: cargo.trim() || null,
      status,
      email: email.trim() || null,
      telefone: onlyDigits(telefone) || null,
      whatsapp: onlyDigits(whatsapp) || null,
      tipo_documento: tipoDocumento || null,
      documento: onlyDigits(documento) || null,
      razao_social: razaoSocial.trim() || null,
      cep: onlyDigits(cep) || null,
      endereco: endereco.trim() || null,
      numero: numero.trim() || null,
      complemento: complemento.trim() || null,
      bairro: bairro.trim() || null,
      cidade: cidade.trim() || null,
      estado: estado.trim().toUpperCase() || null,
      chave_pix: chavePix.trim() || null,
      observacoes: observacoes.trim() || null,
    };
  };

  const handleSaveMembro = async () => {
    if (editingMembroId && !podeEditar) {
      alert("Você não tem permissão para editar membros.");
      return;
    }

    if (!editingMembroId && !podeCriar) {
      alert("Você não tem permissão para cadastrar membros.");
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      if (editingMembroId) {
        const { error } = await supabase
          .from("membros_equipe")
          .update(getPayload())
          .eq("membro_id", editingMembroId)
          .eq("empresa_id", empresaId);

        if (error) {
          console.error("Erro ao atualizar membro:", error);
          alert(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("membros_equipe").insert([
          {
            empresa_id: empresaId,
            ...getPayload(),
          },
        ]);

        if (error) {
          console.error("Erro ao cadastrar membro:", error);
          alert(error.message);
          return;
        }
      }

      resetForm();
      setOpenModal(false);
      await loadPage();
    } catch (err) {
      console.error("Erro inesperado ao salvar membro:", err);
      alert("Erro de conexão ao salvar membro.");
    } finally {
      setSaving(false);
    }
  };

  const filteredMembros = useMemo(() => {
    return membros.filter((membro) => {
      const term = search.toLowerCase();

      const tipoNormalizado = membro.tipo_membro;

      const matchesSearch =
        !term ||
        (membro.nome || "").toLowerCase().includes(term) ||
        (membro.email || "").toLowerCase().includes(term) ||
        (membro.cargo || "").toLowerCase().includes(term) ||
        (membro.documento || "").toLowerCase().includes(term) ||
        (membro.razao_social || "").toLowerCase().includes(term) ||
        (membro.cidade || "").toLowerCase().includes(term);

      const matchesTipo =
        tipoFilter === "Todos" || tipoNormalizado === tipoFilter;

      const matchesStatus =
        statusFilter === "Todos" || membro.status === statusFilter;

      return matchesSearch && matchesTipo && matchesStatus;
    });
  }, [membros, search, tipoFilter, statusFilter]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatTipoMembro = (value: string) => {
    if (value === "colaborador") return "Colaborador";
    if (value === "terceirizado") return "Terceirizado";
    return value;
  };

  const formatStatus = (value: string) => {
    if (value === "ativo") return "Ativo";
    if (value === "inativo") return "Inativo";
    return value;
  };

  return (
    <AppLayout>
      <div>
        <div style={pageHeader}>
          <div>
            <h1 style={title}>Equipe</h1>
            <p style={subtitle}>
              {loading
                ? "Carregando membros..."
                : `${filteredMembros.length} membros cadastrados`}
            </p>
          </div>

          {podeCriar && (
            <div style={headerActions}>
              <button onClick={handleOpenVincularModal} style={primaryButton}>
                + Vincular usuário
              </button>

              <button onClick={handleOpenCreateModal} style={secondaryButton}>
                Cadastrar manualmente
              </button>
            </div>
          )}
        </div>

        <div style={filtersRow}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, cargo, documento..."
            style={searchInput}
          />

          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            style={filterInput}
          >
            <option value="Todos">Todos os relacionamentos</option>
            <option value="colaborador">Colaborador</option>
            <option value="terceirizado">Terceirizado</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterInput}
          >
            <option value="Todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <div style={card}>
          {loading ? (
            <div style={emptyState}>Carregando equipe...</div>
          ) : filteredMembros.length === 0 ? (
            <div style={emptyState}>Nenhum membro encontrado.</div>
          ) : (
            filteredMembros.map((membro, i) => (
              <div
                key={membro.membro_id}
                style={{
                  ...row,
                  borderBottom:
                    i !== filteredMembros.length - 1
                      ? "1px solid #f1f5f9"
                      : "none",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={avatarBox}>{getInitials(membro.nome)}</div>

                  <div>
                    <div style={nameStyle}>{membro.nome}</div>

                    <div style={emailStyle}>
                      {membro.email || "Sem e-mail"}{" "}
                      {membro.cargo ? `• ${membro.cargo}` : ""}
                    </div>

                    <div style={smallInfo}>
                      {membro.whatsapp
                        ? `WhatsApp: ${formatStoredPhone(membro.whatsapp)}`
                        : membro.telefone
                          ? `Telefone: ${formatStoredPhone(membro.telefone)}`
                          : "Sem telefone"}
                      {membro.cidade || membro.estado
                        ? ` • ${membro.cidade || "-"} / ${membro.estado || "-"}`
                        : ""}
                      {membro.documento
                        ? ` • ${formatStoredDocumento(
                            membro.documento,
                            membro.tipo_documento,
                          )}`
                        : ""}
                    </div>
                  </div>
                </div>

                <div style={rightArea}>
                  <span style={tipoBadge(membro.tipo_membro)}>
                    {formatTipoMembro(membro.tipo_membro)}
                  </span>

                  <span style={statusBadge(membro.status)}>
                    {formatStatus(membro.status)}
                  </span>

                  <span style={accessBadge(membro.usuario_id)}>
                    {membro.usuario_id ? "Com acesso" : "Sem acesso"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenDetailModal(membro)}
                    style={detailButton}
                  >
                    Ver
                  </button>

                  {podeEditar && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(membro)}
                      style={editButton}
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {openVincularModal && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <div style={modalHeader}>
                <div>
                  <h3 style={modalTitle}>Vincular usuário por código</h3>
                  <p style={modalSubtitle}>
                    Busque o código enviado pelo colaborador e crie o vínculo
                    com a empresa.
                  </p>
                </div>

                <button
                  onClick={handleCloseVincularModal}
                  style={closeButtonStyle}
                >
                  ×
                </button>
              </div>

              <div style={sectionTitle}>Buscar usuário</div>

              <div style={modalGrid}>
                <div>
                  <label style={labelStyle}>Código de vínculo</label>
                  <input
                    value={codigoNovoVinculo}
                    onChange={(e) => {
                      setCodigoNovoVinculo(e.target.value.toUpperCase());
                      setPerfilEncontrado(null);
                    }}
                    placeholder="Ex: 0293B34A"
                    style={inputStyle}
                  />
                  <div style={helperText}>
                    Código gerado na página Meu Perfil do usuário.
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    type="button"
                    onClick={handleBuscarPerfilPorCodigo}
                    disabled={buscandoPerfil}
                    style={primaryButton}
                  >
                    {buscandoPerfil ? "Buscando..." : "Buscar usuário"}
                  </button>
                </div>
              </div>

              {perfilEncontrado && (
                <>
                  <div style={sectionTitle}>Usuário encontrado</div>

                  <div style={perfilPreviewBox}>
                    <div style={avatarBox}>
                      {getInitials(perfilEncontrado.nome)}
                    </div>

                    <div>
                      <div style={nameStyle}>{perfilEncontrado.nome}</div>
                      <div style={emailStyle}>{perfilEncontrado.email}</div>

                      <div style={smallInfo}>
                        {perfilEncontrado.whatsapp
                          ? `WhatsApp: ${formatStoredPhone(perfilEncontrado.whatsapp)}`
                          : perfilEncontrado.telefone
                            ? `Telefone: ${formatStoredPhone(perfilEncontrado.telefone)}`
                            : "Sem telefone"}
                        {perfilEncontrado.cidade || perfilEncontrado.estado
                          ? ` • ${perfilEncontrado.cidade || "-"} / ${
                              perfilEncontrado.estado || "-"
                            }`
                          : ""}
                      </div>
                    </div>
                  </div>

                  <div style={sectionTitle}>Dados do vínculo na empresa</div>

                  <div style={modalGrid}>
                    <div>
                      <label style={labelStyle}>Relacionamento</label>
                      <select
                        value={novoTipoMembro}
                        onChange={(e) => setNovoTipoMembro(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="colaborador">Colaborador</option>
                        <option value="terceirizado">Terceirizado</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Perfil de acesso</label>
                      <select
                        value={novoPerfilAcessoId}
                        onChange={(e) => setNovoPerfilAcessoId(e.target.value)}
                        style={inputStyle}
                      >
                        {perfisAcesso.map((perfil) => (
                          <option
                            key={perfil.perfil_acesso_id}
                            value={perfil.perfil_acesso_id}
                          >
                            {perfil.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={fieldFull}>
                      <label style={labelStyle}>Cargo / função</label>
                      <input
                        value={novoCargo}
                        onChange={(e) => setNovoCargo(e.target.value)}
                        placeholder="Ex: Social media, atendimento, financeiro..."
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldFull}>
                      <label style={labelStyle}>Chave Pix</label>
                      <input
                        value={novaChavePix}
                        onChange={(e) => setNovaChavePix(e.target.value)}
                        placeholder="Opcional"
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldFull}>
                      <label style={labelStyle}>Observações internas</label>
                      <textarea
                        value={novaObservacao}
                        onChange={(e) => setNovaObservacao(e.target.value)}
                        placeholder="Observações visíveis apenas para a empresa..."
                        style={textareaStyle}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={modalFooter}>
                <button
                  onClick={handleCloseVincularModal}
                  style={secondaryButton}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleCriarMembroPorCodigo}
                  disabled={!perfilEncontrado || criandoVinculo}
                  style={primaryButton}
                >
                  {criandoVinculo ? "Vinculando..." : "Criar vínculo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMembro && (
          <div style={overlayStyle}>
            <div style={detailModalStyle}>
              <div style={modalHeader}>
                <div>
                  <h3 style={modalTitle}>{selectedMembro.nome}</h3>
                  <p style={modalSubtitle}>
                    {formatTipoMembro(selectedMembro.tipo_membro)}
                    {selectedMembro.cargo ? ` • ${selectedMembro.cargo}` : ""}
                  </p>
                </div>

                <button
                  onClick={handleCloseDetailModal}
                  style={closeButtonStyle}
                >
                  ×
                </button>
              </div>

              <div style={detailHeaderRow}>
                <span style={tipoBadge(selectedMembro.tipo_membro)}>
                  {formatTipoMembro(selectedMembro.tipo_membro)}
                </span>

                <span style={statusBadge(selectedMembro.status)}>
                  {formatStatus(selectedMembro.status)}
                </span>

                <span style={accessBadge(selectedMembro.usuario_id)}>
                  {selectedMembro.usuario_id ? "Com acesso" : "Sem acesso"}
                </span>
              </div>

              <div style={sectionTitle}>Contato</div>

              <div style={detailGrid}>
                <div style={detailBox}>
                  <div style={detailLabel}>E-mail</div>
                  <div style={detailValue}>{selectedMembro.email || "-"}</div>
                </div>

                <div style={detailBox}>
                  <div style={detailLabel}>Telefone</div>
                  <div style={detailValue}>
                    {selectedMembro.telefone
                      ? formatStoredPhone(selectedMembro.telefone)
                      : "-"}
                  </div>
                </div>

                <div style={detailBox}>
                  <div style={detailLabel}>WhatsApp</div>
                  <div style={detailValue}>
                    {selectedMembro.whatsapp
                      ? formatStoredPhone(selectedMembro.whatsapp)
                      : "-"}
                  </div>
                </div>

                <div style={detailBox}>
                  <div style={detailLabel}>Cargo / função</div>
                  <div style={detailValue}>{selectedMembro.cargo || "-"}</div>
                </div>
              </div>

              <div style={sectionTitle}>Documento</div>

              <div style={detailGrid}>
                <div style={detailBox}>
                  <div style={detailLabel}>Tipo documento</div>
                  <div style={detailValue}>
                    {selectedMembro.tipo_documento
                      ? selectedMembro.tipo_documento.toUpperCase()
                      : "-"}
                  </div>
                </div>

                <div style={detailBox}>
                  <div style={detailLabel}>Documento</div>
                  <div style={detailValue}>
                    {selectedMembro.documento
                      ? formatStoredDocumento(
                          selectedMembro.documento,
                          selectedMembro.tipo_documento,
                        )
                      : "-"}
                  </div>
                </div>

                <div style={{ ...detailBox, gridColumn: "1 / -1" }}>
                  <div style={detailLabel}>Razão social</div>
                  <div style={detailValue}>
                    {selectedMembro.razao_social || "-"}
                  </div>
                </div>
              </div>

              <div style={sectionTitle}>Endereço</div>

              <div style={detailGrid}>
                <div style={{ ...detailBox, gridColumn: "1 / -1" }}>
                  <div style={detailLabel}>Endereço completo</div>
                  <div style={detailValue}>
                    {getEnderecoCompleto(selectedMembro)}
                  </div>
                </div>

                <div style={detailBox}>
                  <div style={detailLabel}>Cidade</div>
                  <div style={detailValue}>{selectedMembro.cidade || "-"}</div>
                </div>

                <div style={detailBox}>
                  <div style={detailLabel}>Estado</div>
                  <div style={detailValue}>{selectedMembro.estado || "-"}</div>
                </div>
              </div>

              <div style={sectionTitle}>Pagamento</div>

              <div style={detailGrid}>
                <div style={{ ...detailBox, gridColumn: "1 / -1" }}>
                  <div style={detailLabel}>Chave Pix</div>
                  <div style={detailValue}>
                    {selectedMembro.chave_pix || "-"}
                  </div>
                </div>
              </div>

              <div style={sectionTitle}>Observações</div>

              <div style={observationBox}>
                {selectedMembro.observacoes || "Nenhuma observação cadastrada."}
              </div>

              <div style={sectionTitle}>Acesso ao sistema</div>

              {selectedMembro.usuario_id ? (
                <div style={linkAccessBox}>
                  <div style={accessInfoBox}>
                    Este membro já está vinculado a um usuário do sistema.
                  </div>

                  {podeEditar ? (
                    <div style={{ marginTop: "12px" }}>
                      <label style={labelStyle}>Perfil de acesso atual</label>

                      <div style={modalGrid}>
                        <div>
                          <select
                            value={perfilAcessoEditId}
                            onChange={(e) =>
                              setPerfilAcessoEditId(e.target.value)
                            }
                            style={inputStyle}
                          >
                            {perfisAcesso.map((perfil) => (
                              <option
                                key={perfil.perfil_acesso_id}
                                value={perfil.perfil_acesso_id}
                              >
                                {perfil.nome}
                              </option>
                            ))}
                          </select>

                          <div style={helperText}>
                            Atual:{" "}
                            {getNomePerfilAcesso(
                              perfilAcessoAtualId || perfilAcessoEditId,
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-start" }}>
                          <button
                            type="button"
                            onClick={handleAtualizarPerfilAcesso}
                            disabled={
                              savingPerfilAcesso ||
                              perfilAcessoEditId === perfilAcessoAtualId
                            }
                            style={primaryButton}
                          >
                            {savingPerfilAcesso
                              ? "Salvando..."
                              : "Salvar perfil de acesso"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={readOnlyInfoBox}>
                      Você não tem permissão para alterar o perfil de acesso.
                    </div>
                  )}
                </div>
              ) : (
                <div style={linkAccessBox}>
                  {podeEditar ? (
                    <>
                      <div style={modalGrid}>
                        <div>
                          <label style={labelStyle}>Código de vínculo</label>
                          <input
                            value={codigoVinculo}
                            onChange={(e) =>
                              setCodigoVinculo(e.target.value.toUpperCase())
                            }
                            placeholder="Ex: 57E7DD5F"
                            style={inputStyle}
                          />
                          <div style={helperText}>
                            Código gerado no perfil do usuário cadastrado.
                          </div>
                        </div>

                        <div>
                          <label style={labelStyle}>Perfil de acesso</label>
                          <select
                            value={perfilVinculoId}
                            onChange={(e) => setPerfilVinculoId(e.target.value)}
                            style={inputStyle}
                          >
                            {perfisAcesso.map((perfil) => (
                              <option
                                key={perfil.perfil_acesso_id}
                                value={perfil.perfil_acesso_id}
                              >
                                {perfil.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={handleVincularUsuario}
                          disabled={linkingUser}
                          style={primaryButton}
                        >
                          {linkingUser ? "Vinculando..." : "Vincular usuário"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={readOnlyInfoBox}>
                      Este membro ainda não possui acesso ao sistema.
                    </div>
                  )}
                </div>
              )}

              <div style={modalFooter}>
                <button
                  onClick={handleCloseDetailModal}
                  style={secondaryButton}
                >
                  Fechar
                </button>

                {podeEditar && (
                  <button onClick={handleEditFromDetail} style={primaryButton}>
                    Editar membro
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {openModal && (
          <div style={overlayStyle}>
            <div style={modalStyle}>
              <div style={modalHeader}>
                <div>
                  <h3 style={modalTitle}>
                    {editingMembroId ? "Editar Membro" : "Novo Membro"}
                  </h3>
                  <p style={modalSubtitle}>
                    {editingMembroId
                      ? "Atualize os dados do membro da equipe."
                      : "Cadastre colaboradores ou terceirizados."}
                  </p>
                </div>

                <button onClick={handleCloseModal} style={closeButtonStyle}>
                  ×
                </button>
              </div>

              <div style={sectionTitle}>Dados principais</div>

              <div style={modalGrid}>
                <div style={fieldFull}>
                  <label style={labelStyle}>Nome completo *</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carolina Martins"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Relacionamento</label>
                  <select
                    value={tipoMembro}
                    onChange={(e) => setTipoMembro(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="terceirizado">Terceirizado</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Cargo / função</label>
                  <input
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Social media"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    style={inputStyle}
                  />
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
                    style={inputStyle}
                    disabled={!tipoDocumento}
                  />
                </div>

                <div style={fieldFull}>
                  <label style={labelStyle}>Razão social</label>
                  <input
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Obrigatório só se fizer sentido para CNPJ"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={sectionTitle}>Endereço</div>

              <div style={modalGrid}>
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

              <div style={sectionTitle}>Pagamento e observações</div>

              <div style={modalGrid}>
                <div style={fieldFull}>
                  <label style={labelStyle}>Chave Pix</label>
                  <input
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="Chave Pix para recompensas/pagamentos"
                    style={inputStyle}
                  />
                </div>

                <div style={fieldFull}>
                  <label style={labelStyle}>Observações</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações adicionais..."
                    style={textareaStyle}
                  />
                </div>
              </div>

              <div style={modalFooter}>
                <button onClick={handleCloseModal} style={secondaryButton}>
                  Cancelar
                </button>

                <button
                  onClick={handleSaveMembro}
                  disabled={saving || loadingCep}
                  style={primaryButton}
                >
                  {saving
                    ? "Salvando..."
                    : editingMembroId
                      ? "Salvar alterações"
                      : "Cadastrar membro"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function tipoBadge(tipo: string) {
  if (tipo === "terceirizado") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
    };
  }

  return {
    background: "#f3f4f6",
    color: "#374151",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
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
      fontWeight: 600,
    };
  }

  return {
    background: "#e5e7eb",
    color: "#6b7280",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
  };
}

function accessBadge(usuarioId: string | null) {
  if (usuarioId) {
    return {
      background: "#ccfbf1",
      color: "#0f766e",
      padding: "3px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
    };
  }

  return {
    background: "#f3f4f6",
    color: "#6b7280",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
  };
}

const headerActions = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const perfilPreviewBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const readOnlyInfoBox = {
  marginTop: "10px",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "12px",
};

const pageHeader = {
  marginBottom: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
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

const filtersRow = {
  display: "flex",
  gap: "10px",
  marginBottom: "16px",
};

const searchInput = {
  flex: 1,
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "12px",
  background: "white",
};

const filterInput = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "12px",
  background: "white",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "0",
  overflow: "hidden",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 10px",
  gap: "12px",
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

const secondaryButton = {
  background: "white",
  color: "#111827",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const editButton = {
  background: "white",
  color: "#0f766e",
  border: "1px solid #99f6e4",
  borderRadius: "999px",
  padding: "4px 9px",
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const detailButton = {
  background: "white",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: "999px",
  padding: "4px 9px",
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const detailModalStyle = {
  width: "100%",
  maxWidth: "720px",
  maxHeight: "90vh",
  overflowY: "auto" as const,
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  border: "1px solid #e5e7eb",
};

const detailHeaderRow = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
  marginBottom: "14px",
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const detailBox = {
  background: "#f8fafc",
  border: "1px solid #f1f5f9",
  borderRadius: "8px",
  padding: "10px",
};

const detailLabel = {
  fontSize: "10px",
  color: "#6b7280",
  marginBottom: "4px",
  fontWeight: 600,
};

const detailValue = {
  fontSize: "12px",
  color: "#111827",
  fontWeight: 600,
  wordBreak: "break-word" as const,
};

const observationBox = {
  background: "#f8fafc",
  border: "1px solid #f1f5f9",
  borderRadius: "8px",
  padding: "10px",
  fontSize: "12px",
  color: "#374151",
  minHeight: "44px",
  whiteSpace: "pre-wrap" as const,
};

const linkAccessBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
};

const accessInfoBox = {
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  color: "#166534",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 600,
};

const avatarBox = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background: "#ccfbf1",
  color: "#0f766e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 700,
};

const nameStyle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#111827",
};

const emailStyle = {
  fontSize: "11px",
  color: "#6b7280",
  marginTop: "2px",
};

const smallInfo = {
  fontSize: "10px",
  color: "#94a3b8",
  marginTop: "2px",
};

const rightArea = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  flexWrap: "wrap" as const,
  justifyContent: "flex-end",
};

const emptyState = {
  padding: "16px",
  fontSize: "12px",
  color: "#6b7280",
};

const overlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  width: "100%",
  maxWidth: "760px",
  maxHeight: "90vh",
  overflowY: "auto" as const,
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  border: "1px solid #e5e7eb",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
  gap: "12px",
};

const modalTitle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
  color: "#111827",
};

const modalSubtitle = {
  margin: "4px 0 0",
  fontSize: "12px",
  color: "#6b7280",
};

const closeButtonStyle = {
  background: "transparent",
  border: "none",
  fontSize: "22px",
  cursor: "pointer",
  color: "#6b7280",
};

const sectionTitle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#111827",
  margin: "14px 0 10px",
  paddingTop: "10px",
  borderTop: "1px solid #f1f5f9",
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
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

const helperText = {
  fontSize: "10px",
  color: "#6b7280",
  marginTop: "4px",
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

const textareaStyle = {
  width: "100%",
  minHeight: "80px",
  resize: "vertical" as const,
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  fontSize: "13px",
  boxSizing: "border-box" as const,
  background: "white",
};

const modalFooter = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "16px",
};

