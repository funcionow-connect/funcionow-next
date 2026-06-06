-- =====================================================
-- Funcionow Connect
-- Schema principal do banco de dados
-- Espelho do Supabase
-- =====================================================

-- TABELA: empresas

create table if not exists public.empresas (
  empresa_id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text,
  status text default 'ativo',
  criada_em timestamp with time zone default now()
);

create index if not exists idx_empresas_status
on public.empresas using btree (status);

-- TABELA: usuarios

create table if not exists public.usuarios (
  usuario_id uuid primary key,
  empresa_id uuid not null references public.empresas(empresa_id),
  nome text not null,
  email text not null unique,
  perfil text not null,
  status text default 'ativo',
  criado_em timestamp with time zone default now(),
  perfil_acesso_id uuid references public.perfis_acesso(perfil_acesso_id)
);

create index if not exists idx_usuarios_empresa
on public.usuarios using btree (empresa_id);

-- TABELA: perfis_acesso

create table if not exists public.perfis_acesso (
  perfil_acesso_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id),
  nome text not null,
  slug text not null,
  descricao text,
  is_admin boolean not null default false,
  sistema boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now()
);

-- TABELA: paginas_sistema

create table if not exists public.paginas_sistema (
  pagina_key text primary key,
  nome text not null,
  rota text not null,
  ordem integer not null default 0,
  ativo boolean not null default true
);

-- TABELA: perfil_acesso_permissoes

create table if not exists public.perfil_acesso_permissoes (
  permissao_id uuid primary key default gen_random_uuid(),
  perfil_acesso_id uuid not null references public.perfis_acesso(perfil_acesso_id),
  pagina_key text not null references public.paginas_sistema(pagina_key),
  pode_acessar boolean not null default false,
  pode_criar boolean not null default false,
  pode_editar boolean not null default false,
  pode_excluir boolean not null default false,
  criado_em timestamp with time zone not null default now()
);

-- TABELA: perfis_usuario

create table if not exists public.perfis_usuario (
  usuario_id uuid primary key,
  nome text not null,
  email text not null,
  telefone text,
  whatsapp text,
  tipo_documento text,
  documento text,
  cep text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  codigo_vinculo text not null,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now()
);

-- TABELA: membros_equipe

create table if not exists public.membros_equipe (
  membro_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id),
  usuario_id uuid references public.usuarios(usuario_id),
  nome text not null,
  tipo_membro text not null default 'colaborador',
  cargo text,
  status text not null default 'ativo',
  email text,
  telefone text,
  whatsapp text,
  tipo_documento text,
  documento text,
  razao_social text,
  cep text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  chave_pix text,
  tipo_chave_pix text,
  banco text,
  observacoes text,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now()
);

-- TABELA: creators

create table if not exists public.creators (
  creator_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id),
  nome text not null,
  instagram text not null,
  status text default 'em_analise',
  score_total numeric,
  criado_em timestamp with time zone not null default now(),
  foto_url text,
  categoria_id uuid
);

-- TABELA: creator_captacao

create table if not exists public.creator_captacao (
  captacao_id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(creator_id),
  empresa_id uuid not null references public.empresas(empresa_id),

  seguidores bigint,
  curtidas_medias integer,
  comentarios_medios integer,

  tipo_creator text,

  segmento_id uuid,
  area_speaker_id uuid,

  atualizado_em timestamp with time zone not null default now()
);

-- TABELA: funil_etapas

create table if not exists public.funil_etapas (
  etapa_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id),
  ordem integer not null,
  nome text not null,
  descricao text
);

-- TABELA: criterios_avaliacao

create table if not exists public.criterios_avaliacao (
  criterio_id uuid primary key default gen_random_uuid(),

  empresa_id uuid references public.empresas(empresa_id),
  etapa_id uuid references public.funil_etapas(etapa_id),

  nome text not null,
  peso numeric not null default 1,
  obrigatorio boolean not null default false,
  tipo_resposta text not null,

  ordem integer,
  categoria_criterios text
);

-- TABELA: creator_avaliacoes

create table if not exists public.creator_avaliacoes (
  avaliacao_id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(creator_id),
  empresa_id uuid not null references public.empresas(empresa_id),
  etapa_id uuid references public.funil_etapas(etapa_id),
  status_decisao text,
  score_parcial numeric,
  observacoes text,
  avaliado_em timestamp with time zone default now()
);

-- TABELA: resultado_criterio

create table if not exists public.resultado_criterio (
  resultado_id uuid primary key default gen_random_uuid(),

  avaliacao_id uuid not null
    references public.creator_avaliacoes(avaliacao_id),

  criterio_id uuid not null
    references public.criterios_avaliacao(criterio_id),

  empresa_id uuid not null
    references public.empresas(empresa_id),

  valor text,
  pontuacao_calculada numeric
);

-- TABELA: categorias

create table if not exists public.categorias (
  categoria_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id),
  nome text not null,
  ativo boolean default true,
  created_at timestamp with time zone not null default now()
);

-- TABELA: segmentos

create table if not exists public.segmentos (
  segmento_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id),

  categoria_id uuid references public.categorias(categoria_id),

  nome text not null,
  ativo boolean,
  tem_especialidade boolean default false,

  created_at timestamp with time zone not null default now()
);

-- TABELA: areas_speaker

create table if not exists public.areas_speaker (
  area_speaker_id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(empresa_id),
  segmento_id uuid not null references public.segmentos(segmento_id),
  nome text not null,
  ativo boolean default true,
  created_at timestamp with time zone not null default now()
);

-- TABELA: configuracoes_funil

create table if not exists public.configuracoes_funil (
  config_id uuid primary key default gen_random_uuid(),

  empresa_id uuid not null
    references public.empresas(empresa_id),

  min_score_aprovacao numeric default 7,
  min_score_potencial numeric default 5,

  permitir_potencial boolean default true,
  permitir_revisao boolean default true
);

