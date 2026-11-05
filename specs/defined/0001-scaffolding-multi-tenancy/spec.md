| Campo | Valor |
|---|---|
| Identificador | 0001-scaffolding-multi-tenancy |
| Título | Multi-Tenancy Hierárquico (Super Admin, Escritório, Empresas) e Sistema de Personificação |
| Status | Defined |
| Effort | 6 |
| Effort updated at | 2026-11-05 |
| Effort rationale | Aumento de esforço de 4 para 6 devido à inclusão da hierarquia em 3 níveis (Super Admin -> Escritório -> Empresas), suporte a usuários emitindo por múltiplas empresas do mesmo escritório, personificação (impersonate) e auditoria de duplo contexto. |

# 0001: Multi-Tenancy Hierárquico e Sistema de Personificação

## 1. Contexto e Problema
O modelo de negócio do **Nota Fácil Emissor Web** possui uma estrutura organizacional em 3 níveis interdependentes:
1. **Super Admin:** Administrador global da plataforma SaaS.
2. **Escritório de Contabilidade (`Office`):** Tenant agregador que gerencia carteiras de clientes. Seus usuários precisam emitir notas em nome de qualquer cliente da sua carteira.
3. **Empresa Emitente (`Company`):** Clientes do escritório. Usuários da empresa emitem em nome da sua empresa e podem ter acesso a outras empresas do mesmo grupo/escritório.
4. **Personificação:** Super Admin deve personificar qualquer escritório ou cliente; Usuários de escritório devem poder personificar seus clientes para suporte e auditoria.

## 2. Objetivo da Spec
Implementar a infraestrutura de dados, modelos Eloquent, permissões e middleware de personificação com dupla auditoria (quem está executando vs. quem está sendo personificado).

## 3. Requisitos Funcionais

### 3.1. Estrutura de Tabelas e Modelos
- [ ] Tabela e Model `offices`: `id`, `name`, `cnpj`, `status`.
- [ ] Tabela e Model `companies`: `id`, `office_id`, `name`, `cnpj`, `status`.
- [ ] Tabela e Model `users`: `id`, `name`, `email`, `password`, `role` (`SUPER_ADMIN`, `OFFICE_USER`, `COMPANY_USER`), `office_id` (opcional para Super Admin).
- [ ] Tabela pivot `company_user`: `company_id`, `user_id`, `is_default` (para usuários de empresas que emitem por mais de uma empresa do mesmo escritório).

### 3.2. Mecanismo de Personificação (Impersonation)
- [ ] `ImpersonationManager` (Service):
  - Inicia personificação de um `Office` ou `Company`.
  - Persiste na sessão / token JWT: `real_user_id`, `impersonated_office_id`, `impersonated_company_id`.
  - Método `stopImpersonating()` para restaurar a identidade original.
- [ ] Auditoria de Emissão: Toda nota salva `created_by_user_id` (usuário real) e `acting_role` / `impersonated_context`.

### 3.3. TenantScope Dinâmico no Eloquent
- [ ] `App\Models\Scopes\HierarchicalTenantScope`:
  - **Super Admin:** Não filtra nada quando sem personificação ativa. Com personificação, filtra pelo contexto alvo.
  - **Office User:** Filtra automaticamente por `office_id = user->office_id`. Permite selecionar qualquer `Company` pertencente ao escritório para emissão.
  - **Company User:** Filtra por `company_id IN (empresas_associadas_do_usuario)`.

## 4. Critérios de Aceite e Verificação
- [ ] **Cenário 1 (Super Admin Global):** Super Admin consegue ver todas as notas do sistema; ao personificar o Escritório X, passa a ver exatamente e apenas a carteira do Escritório X.
- [ ] **Cenário 2 (Emissão por Escritório):** Um usuário com perfil `OFFICE_USER` consegue criar e autorizar uma NFS-e para a Empresa 1 e para a Empresa 2, ambas do seu escritório.
- [ ] **Cenário 3 (Isolamento entre Escritórios):** O Escritório A jamais consegue ver empresas ou emitir notas de empresas pertencentes ao Escritório B.
- [ ] **Cenário 4 (Empresa com Múltiplas Unidades):** Um usuário `COMPANY_USER` vinculado às empresas 1 e 2 do mesmo escritório consegue alternar entre elas para emitir notas, mas não acessa a empresa 3.
- [ ] **Cenário 5 (Trilha de Auditoria):** Se o Super Admin personificar o cliente e emitir uma nota, a tabela `invoices` registra o ID do Super Admin como criador e a empresa cliente como emitente.
- [ ] **Cenário 6 (Testes Pest):** Suíte de testes com cobertura completa dos 5 cenários descritos.
