# Funcionow Connect - Arquitetura do Banco de Dados

## Visão Geral

Funcionow Connect é uma plataforma multiempresa para gestão de creators, avaliação de perfil, score fit e gestão de equipes.

A arquitetura foi construída para suportar múltiplas empresas isoladas através de RLS (Row Level Security).

---

# Módulo Multiempresa

## empresas

Representa cada cliente da plataforma.

Principais campos:

* empresa_id
* nome
* segmento
* status

---

## usuarios

Usuários vinculados a uma empresa.

Principais campos:

* usuario_id
* empresa_id
* nome
* email
* perfil
* perfil_acesso_id

Perfis atuais:

* admin
* suporte
* terceirizado

---

## perfis_usuario

Perfil global do usuário na plataforma.

Existe mesmo antes do usuário ser vinculado a uma empresa.

Principais campos:

* usuario_id
* nome
* email
* codigo_vinculo

---

## membros_equipe

Representa colaboradores e terceirizados de uma empresa.

Principais campos:

* membro_id
* empresa_id
* usuario_id
* nome
* cargo
* tipo_membro
* status

Tipos:

* colaborador
* terceirizado

---

# Controle de Acesso

## perfis_acesso

Perfis configuráveis por empresa.

Perfis padrão:

* Admin
* Operacional
* Externo

---

## paginas_sistema

Cadastro das páginas disponíveis no sistema.

Exemplos:

* dashboard
* creators
* perfil
* campanhas

---

## perfil_acesso_permissoes

Permissões por página.

Controle de:

* pode_acessar
* pode_criar
* pode_editar
* pode_excluir

---

# Módulo Creators

## creators

Cadastro principal dos creators.

Principais campos:

* creator_id
* empresa_id
* nome
* instagram
* categoria_id
* score_total
* status

---

## creator_captacao

Informações captadas do creator.

Principais campos:

* seguidores
* curtidas_medias
* comentarios_medios
* tipo_creator
* segmento_id
* area_speaker_id

Classificação automática:

* nano
* micro
* meso
* macro
* mega

---

## categorias

Categorias de creators.

Exemplos:

* Lifestyle
* Negócios
* Saúde

---

## segmentos

Segmentos vinculados a categorias.

Exemplos:

Categoria Saúde

* Nutrição
* Academia
* Corrida

---

## areas_speaker

Especialidades dentro de um segmento.

Exemplos:

Marketing

* SEO
* Copywriting
* Tráfego Pago

---

# Módulo Score Fit

## funil_etapas

Etapas do processo de avaliação.

Exemplos:

* Captação
* Qualificação
* Aprovação

---

## criterios_avaliacao

Critérios utilizados na avaliação.

Principais campos:

* peso
* obrigatorio
* tipo_resposta

---

## creator_avaliacoes

Avaliação geral realizada para um creator.

Campos:

* score_parcial
* status_decisao
* observacoes

---

## resultado_criterio

Resposta individual de cada critério.

Campos:

* valor
* pontuacao_calculada

---

## configuracoes_funil

Configuração de score da empresa.

Campos:

* min_score_aprovacao
* min_score_potencial
* permitir_potencial
* permitir_revisao

---

# Regra de Score

Score final calculado pela função:

salvar_avaliacao_creator()

Regra:

Aprovado:
score >= min_score_aprovacao

Potencial:
score >= min_score_potencial
e permitir_potencial = true

Reprovado:
abaixo dos limites configurados

---

# Views

## v_funil_lista

View utilizada na listagem principal de creators.

Retorna:

* creator
* categoria
* segmento
* especialidade
* engajamento
* score
* status

---

## v_creator_detalhe

View utilizada na página de detalhe.

Retorna:

* dados completos do creator
* última captação
* última avaliação
* score fit detalhado

---

## v_creator_score_fit

View utilizada para exibição detalhada dos critérios avaliados.

---

# Functions Principais

## handle_new_user()

Executada após cadastro.

Responsável por:

* criar empresa
* criar perfis padrão
* criar permissões padrão
* criar usuário admin

---

## gerar_codigo_vinculo_usuario()

Gera código único para vínculo de usuários.

Exemplo:

AB12CD34

---

## criar_membro_por_codigo()

Adiciona usuário existente à equipe usando código de vínculo.

---

## vincular_membro_por_codigo()

Vincula membro da equipe a um usuário existente.

---

## salvar_avaliacao_creator()

Função principal do Score Fit.

Responsável por:

* salvar respostas
* calcular score
* definir aprovado/potencial/reprovado

---

## fn_calcular_tipo_creator()

Classifica creator automaticamente:

* nano
* micro
* meso
* macro
* mega

---

# Triggers

## creator_captacao

* atualização automática de atualizado_em
* cálculo automático do tipo_creator

## membros_equipe

* atualização automática de atualizado_em

## perfis_usuario

* atualização automática de atualizado_em

---

# Segurança

Todas as tabelas principais utilizam RLS.

Separação de dados por empresa através de policies específicas.

Nenhum usuário pode acessar dados de outra empresa.

---

# Próximos Módulos Planejados

* Projetos
* Tarefas
* Kanban
* Calendário
* Reuniões
* CRM Interno
* Gestão Operacional da Empresa

Todos os novos módulos devem reutilizar:

* usuarios
* membros_equipe
* perfis_acesso
* perfil_acesso_permissoes

evitando duplicação de estruturas já existentes.
