# Instruções permanentes do projeto Funcionow Connect

Antes de qualquer alteração, consulte estas regras e faça uma análise da plataforma:

1. Verifique se o recurso solicitado já existe, inclusive com outro nome ou em outra seção. Não crie funcionalidades duplicadas. Quando houver algo semelhante, prefira melhorar e reaproveitar o recurso existente.
2. Preserve o comportamento já validado e a identidade visual do produto. Antes de editar, entenda as dependências entre telas, componentes, permissões, assinaturas e banco de dados.
3. Proteja os dados reais da empresa oficial Body B. Nunca faça limpeza, exclusão, reset, alteração destrutiva ou mudança de schema sem confirmar o impacto e fazer uma verificação de segurança.
4. Para mudanças de banco, prefira migrations idempotentes e reversíveis quando possível. Verifique RLS, grants, compatibilidade com dados existentes e o efeito no ambiente de produção antes de executar.
5. Depois de cada melhoria, rode as validações adequadas (incluindo build quando houver alteração de código) e confira que os recursos existentes continuam funcionando.
6. Mudanças fortes, migrações destrutivas, alterações de permissões, regras de assinatura ou decisões que afetem produção devem ser explicadas e discutidas antes da execução. Mudanças pequenas e reversíveis podem seguir com autonomia.
7. Registre no resumo da alteração o que foi analisado, o que foi preservado, quais riscos foram verificados e quais validações foram executadas.

A conta Body B é a conta oficial de validação da plataforma. Trate seus dados como dados de produção e não presuma que o banco pode ser limpo.
