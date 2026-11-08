# Especificação integrada: Multi-Tenancy Hierárquico e Personificação Segura

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0001 |
| Slug | 0001-scaffolding-multi-tenancy |
| Status | Planned |
| Effort | 6 |
| Effort updated at | 2026-11-05 |
| Effort rationale | Estrutura hierárquica em 3 níveis (Super Admin -> Escritório -> Empresas), personificação multi-aba com tarja persistente, auditoria de duplo contexto e autorização granular de certificados A1. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-11-05 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema
O FiscalFlow necessita de isolamento seguro entre escritórios contábeis concorrentes sem perder a flexibilidade operacional: contadores precisam gerenciar e emitir notas de dezenas de empresas clientes sem atrito de login; o Super Admin precisa prestar suporte e auditar operações personificando entidades; e empresas clientes precisam de autonomia para cadastrar certificados e emitir notas diretamente, sob supervisão e governança do escritório.

#### Resultado desejado
Uma arquitetura de multi-tenancy robusta no Laravel 11 onde:
1. O Super Admin acessa e personifica qualquer entidade com trilha de auditoria inviolável.
2. O Escritório cadastra empresas diretamente e emite notas em nome de qualquer cliente da sua carteira via seletor rápido.
3. A personificação opera por abas independentes (header/query context) e exibe tarja de identificação obrigatória.
4. O isolamento de banco de dados é garantido automaticamente por `TenantScope` dinâmico em jobs assíncronos e queries Eloquent.

#### Métricas de sucesso
- 100% de isolamento entre escritórios (zero vazamento de dados em queries Eloquent).
- 100% das emissões registram o ID real do operador e o contexto personificado.
- Zero perda de contexto ao abrir múltiplas abas com empresas personificadas distintas.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: O sistema legado dependia unicamente de RLS no Postgres, deixando vulneráveis queries com `service_role` ou conexões de background sem `auth.uid()`.
- **R-002**: A personificação via sessão clássica de cookie sobrescreve o estado global da aplicação e impede o operador de trabalhar com clientes diferentes em abas paralelas do navegador.

#### Fontes e contexto consultados
- `docs/reversa_sdd/domain.md` (Agregados `Office`, `Company`, `User`).
- `docs/reversa_sdd/audit/logic_flaws.md` (Falha **LOGIC-009**: Dependência exclusiva de RLS).
- `.specsfy/RULES_TENANCY.md` (Contrato canônico de hierarquia em 3 níveis).

#### Documentação consultada
- Laravel 11 Documentation: Eloquent Global Scopes, Session Management, Custom Middleware.
- Inertia.js v2 Documentation: Shared Data, Persistent Layouts, Header propagation.

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: O escritório pode cadastrar novas empresas clientes diretamente sem aprovação da plataforma? → **A**: Sim, o escritório tem autonomia total para cadastrar e ativar empresas da sua carteira.
- **Q**: O operador do escritório precisa "entrar" no painel da empresa cliente para emitir uma nota avulsa? → **A**: Não, um seletor rápido (dropdown/modal) permite selecionar qualquer empresa do escritório na própria tela de emissão.
- **Q**: A personificação deve suportar múltiplas abas navegando em empresas diferentes? → **A**: Sim, o contexto personificado é propagado por header/parâmetro de rota e a interface exibe tarja fixa com o nome da empresa ativa.
- **Q**: Quem gerencia o Certificado Digital A1 da empresa? → **A**: Ambos (escritório e cliente), mas o escritório possui flag para desativar a permissão de upload do cliente se desejar centralizar o controle.
- **Q**: O Super Admin precisa justificar com texto o motivo da personificação? → **A**: Não, apenas registrar auditoria inviolável (ID do autor, data, hora, IP e contexto personificado).
- **Q**: Como o `TenantScope` opera em Jobs de background (Redis)? → **A**: O Job carrega explicitamente o `tenant_id` e restaura o escopo antes da execução.

#### Dúvidas abertas
- Nenhuma.

### 3. Escopo e atores

#### Incluído
- CRUD de `offices`, `companies`, `users` e pivot `company_user`.
- Middleware `HierarchicalTenantScope` no Eloquent com suporte a Super Admin, Escritório e Empresa.
- Mecanismo de Personificação multi-aba com cabeçalho `X-Impersonate-Company-Id` e fallback de sessão.
- Tarja visual de personificação ativa no Shell da aplicação Inertia.
- Trilha de auditoria dupla em todas as mutações e emissões de notas.

#### Fora de escopo
- Transmissão real de DPS para o gateway ACBr (escopo da Spec 0004 e 0005).
- Cálculo das alíquotas fiscais (escopo da Spec 0003).

#### Atores
- **Super Admin:** Administrador da plataforma SaaS com privilégios irrestritos e personificação global.
- **Operador do Escritório (`Office User`):** Contador ou auxiliar com acesso a todas as empresas do escritório.
- **Operador da Empresa (`Company User`):** Faturista com acesso restrito a uma ou mais empresas autorizadas.

### 4. Princípios e restrições do projeto
- **PR-001**: O isolamento de dados do tenant é inegociável; nenhum model com tenant pode ser consultado sem escopo ativo, exceto pelo Super Admin sem personificação.
- **PR-002**: Toda ação executada em modo personificado deve registrar o ID real do usuário autenticado para resguardo jurídico.
- **PR-003**: Interfaces construídas em Inertia React seguem o padrão Shadcn/Tailwind com acessibilidade e semântica de breadcrumb.

### 5. Histórias de usuário

#### US-001 — Gestão de Empresas e Emissão Rápida pelo Escritório (P1)
Como Operador do Escritório, quero cadastrar empresas diretamente e selecioná-las rapidamente na emissão, para gerenciar a carteira sem atrito de login.

**Por que P1**: Bloqueador de onboarding de clientes e emissão.  
**Teste independente**: Criar uma empresa pelo escritório e emitir nota diretamente via seletor rápido.  
**Requisitos**: FR-001, FR-002, NFR-001, NFR-002.

#### US-002 — Personificação Segura com Tarja e Suporte Multi-Aba (P1)
Como Super Admin ou Operador do Escritório, quero personificar uma empresa cliente com indicação visual clara e suporte a abas independentes, para prestar suporte e operar em nome do cliente sem conflito de navegação.

**Por que P1**: Essencial para usabilidade contábil (operar múltiplos clientes simultâneos) e suporte técnico.  
**Teste independente**: Abrir requisição com header de personificação e validar dados retornados e tarja de aviso.  
**Requisitos**: FR-001, FR-002, NFR-001, NFR-002.

#### US-003 — Isolamento Multi-Tenant e Governança de Certificados (P1)
Como Escritório, quero definir se o cliente pode ou não gerenciar seu próprio Certificado A1, garantindo que os dados e certificados fiquem protegidos contra vazamento ou adulteração indevida.

**Por que P1**: Segurança jurídica e proteção do arquivo criptográfico PKCS#12 da empresa.  
**Teste independente**: Testar tentativa de upload por usuário de empresa com flag de permissão desativada.  
**Requisitos**: FR-001, FR-002, NFR-001, NFR-002.

### 6. Cenários BDD de aceite

#### AC-001 — Cadastro direto de empresa pelo escritório
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-001
Feature: Gestão de Carteira do Escritório

  Scenario: Operador do escritório cadastra empresa cliente com sucesso
    Given que estou autenticado como operador do "Escritório Alfa"
    When submeto o formulário de cadastro com Razão Social "Padaria Central" e CNPJ "11.222.333/0001-44"
    Then a empresa "Padaria Central" deve ser criada vinculada ao "Escritório Alfa"
    And deve ficar imediatamente disponível no seletor de emissão do escritório
    And operadores do "Escritório Beta" não conseguem visualizar a "Padaria Central"
```

#### AC-002 — Personificação em aba isolada com tarja informativa
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-002
Feature: Personificação Multi-Aba

  Scenario: Operador personifica empresa cliente e visualiza tarja de contexto
    Given que estou autenticado como operador do "Escritório Alfa"
    When personifico a empresa "Padaria Central"
    Then o shell da aplicação deve exibir uma tarja fixa no topo com "Personificando: Padaria Central"
    And a ação de "Sair da Personificação" deve estar disponível na tarja
    And requisições enviadas com o header de personificação retornam apenas dados da "Padaria Central"
```

#### AC-003 — Bloqueio de upload de certificado por política do escritório
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-003
Feature: Governança de Certificado Digital

  Scenario: Usuário da empresa tenta enviar certificado com permissão revogada pelo escritório
    Given que a empresa "Padaria Central" possui a flag "allow_client_certificate_upload" como falsa
    And estou autenticado como operador da empresa "Padaria Central"
    When tento acessar a tela ou enviar requisição de upload de certificado
    Then o sistema deve retornar erro HTTP 403 Proibido
    And exibir a mensagem "O gerenciamento de certificados desta empresa é centralizado pelo seu escritório contábil"
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve permitir que operadores de escritórios contábeis criem, editem e ativem empresas clientes sem aprovação prévia da plataforma, suportando personificação multi-aba com tarja persistente e auditoria de duplo contexto.
- **FR-002**: A tela de emissão deve fornecer um seletor instantâneo de empresas pertencentes ao escritório autenticado para emissão sem necessidade de personificação formal, respeitando flags de governança de certificados A1.

#### Não funcionais
- **NFR-001**: O tempo de resolução de tenant e personificação no middleware não deve exceder 5ms. **Verificação**: Teste de profiling em endpoint autenticado.
- **NFR-002**: O isolamento multi-tenant deve ser validado via testes automatizados no Pest, garantindo que queries não vazem dados entre escritórios concorrentes. **Verificação**: Suíte Pest em `tests/Feature/MultiTenancyTest.php`.

#### Erros e casos-limite
- Tentativa de personificar empresa de outro escritório → HTTP 403 Forbidden com log de alerta de segurança.
- Operador de empresa tentando forçar header de personificação → Header sumariamente ignorado e log de anomalia registrado.
- Perda de sessão durante personificação → Redirecionamento limpo para tela de login preservando mensagem explicativa.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
- Repositório inicializado em `/home/rogerio/Projetos/1 - nota facil emissor web`.
- Stack: Laravel 11, PHP 8.3, Inertia.js (React 18), Tailwind CSS, PostgreSQL e Redis.

#### Arquitetura e módulos
- `App\Models\Office`: Tenant nível 1.
- `App\Models\Company`: Tenant nível 2 com flags de certificado e configuração fiscal.
- `App\Models\User`: Operador com roles (`SUPER_ADMIN`, `OFFICE_USER`, `COMPANY_USER`).
- `App\Models\Scopes\HierarchicalTenantScope`: Global Scope responsável por filtrar por escritório ou empresa associada.
- `App\Services\ImpersonationManager`: Serviço que resolve o contexto ativo a partir de headers/sessão.
- `App\Http\Middleware\EnsureTenantContext`: Injeta o contexto no request e compartilha dados com o Inertia.

#### Migrations
- `create_offices_table.php`: `id` (UUID), `name`, `cnpj`, `status`, `timestamps`.
- `create_companies_table.php`: `id` (UUID), `office_id` (FK), `name`, `cnpj`, `allow_client_certificate_upload` (bool), `status`, `timestamps`.
- `create_company_user_table.php`: `company_id` (FK), `user_id` (FK), `is_default` (bool).
- `add_role_and_office_to_users_table.php`: `role`, `office_id` (FK nullable).

#### Models
- `Office`: Relações `companies()`, `users()`.
- `Company`: Relações `office()`, `users()`, `invoices()`. Trait `BelongsToTenant`.
- `User`: Helper methods `isSuperAdmin()`, `isOfficeUser()`, `canManageCompany(Company $company)`.

#### Controllers e casos de uso
- `App\Http\Controllers\ImpersonationController`: Métodos `start()`, `stop()`.
- `App\Http\Controllers\CompanyController`: CRUD de empresas com validação de permissão.

#### Views e experiência
- `resources/js/Layouts/AuthenticatedLayout.tsx`: Renderiza o shell com a `ImpersonationBanner` fixada no topo.
- `resources/js/Components/ImpersonationBanner.tsx`: Componente visual com alerta amarelo/laranja, nome da empresa personificada e botão de saída.
- `resources/js/Components/CompanySwitcher.tsx`: Seletor rápido de empresas no header para operadores de escritório.

#### Estrutura de arquivos
```text
app/
  Models/
    Concerns/BelongsToTenant.php
    Scopes/HierarchicalTenantScope.php
    Office.php
    Company.php
    User.php
  Services/
    ImpersonationManager.php
  Http/
    Middleware/EnsureTenantContext.php
    Controllers/ImpersonationController.php
    Controllers/CompanyController.php
resources/js/
  Components/
    ImpersonationBanner.tsx
    CompanySwitcher.tsx
  Pages/
    Companies/Index.tsx
tests/
  Feature/MultiTenancyTest.php
  Feature/ImpersonationTest.php
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Office | UUID | `name` (string), `cnpj` (14 chars), `status` (ACTIVE/SUSPENDED) | HasMany `Company`, HasMany `User` |
| Company | UUID | `office_id` (FK), `name` (string), `cnpj` (14 chars), `allow_client_certificate_upload` (bool, default true) | BelongsTo `Office`, BelongsToMany `User` |
| User | UUID | `name`, `email`, `role` (SUPER_ADMIN, OFFICE_USER, COMPANY_USER), `office_id` (FK nullable) | BelongsTo `Office`, BelongsToMany `Company` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Impersonation | Inativa | Iniciar personificação | Ativa | Registra ID real na sessão e emite evento de auditoria |
| Impersonation | Ativa | Sair da personificação | Inativa | Restaura identidade sem deslogar o usuário |

#### Migração e retenção
- Não aplicável (projeto novo em base limpa).

### 10. Interfaces e contratos

#### Interface para pessoas
- **Há interface para pessoas**: Sim.

#### Stack e convenções de interface
- Inertia.js v2 com React 18, Tailwind CSS, componentes Shadcn/ui.
- Telas afetadas: Shell da aplicação (`AuthenticatedLayout`), Listagem de Empresas e Seletor de Emissão.

#### Telas e responsabilidades
- `ImpersonationBanner`: Exibir tarja persistente no topo de todas as páginas quando em modo de personificação.
- `CompanySwitcher`: Modal/Dropdown de seleção rápida de empresas da carteira do escritório.

#### Fluxo de informação e navegação
- A pessoa autentica no sistema, acessa o painel do escritório e visualiza a lista de empresas. O `Breadcrumb` mantém a trilha `Escritório > Empresas > Empresa Atual`. Ao clicar em "Personificar", o shell recarrega com a tarja superior e todo o contexto passa a ser da empresa escolhida até clicar em "Sair da Personificação".

#### Menus e navegação principal
- O menu principal lateral mapeia os seguintes itens e destinos: item Dashboard com rota `/dashboard`, item Empresas com rota `/companies`, item Notas Fiscais com rota `/invoices`, item Certificados com rota `/certificates` e item Configurações com rota `/settings`. Cada menu direciona para a tela correspondente, aplicando controle de permissões por perfil. Em dispositivos móveis, o menu responde através de gaveta (drawer) retrátil para garantir navegação acessível.

#### Formulários e ações
- Formulário de Criação de Empresa: Campos Razão Social, Nome Fantasia, CNPJ, Inscrição Municipal, CEP e Flag de Delegação de Certificado. Ação primária "Salvar Empresa" com validação síncrona de campos.

#### Composição e disposição
- Shell com navegação lateral, topo com seletor de empresa e tarja destacada para personificação.

#### Blocos React e componentes selecionados

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- |
| Shell Global | ImpersonationBanner | Tarja visual fixa avisando personificação | resources/js/Components/ImpersonationBanner.tsx | Alert, Button | shadcn/ui | Componente novo |
| Header Shell | CompanySwitcher | Seletor rápido de empresas da carteira | resources/js/Components/CompanySwitcher.tsx | Command, Popover | shadcn/ui | Adaptado do legado |

#### Estados e acessibilidade
- Tarja de personificação possui `role="alert"`, contraste visual em amarelo de advertência e navegação acessível por teclado (tecla ESC para fechar modal). O `Breadcrumb` mantém a equipe visível.

#### Contrato CRUD
- O CRUD de empresas utiliza o mesmo `PageHeader` componentizado e reutilizável para lista, detalhe, criação e edição. A listagem usa `DataGrid` em largura total, mantém a coluna `ID` visível, transforma a linha inteira em link para o detalhe e oferece botões independentes de editar e apagar.

#### Revisão visual durante o desenvolvimento
- A revisão visual confere bordas, espaçamentos, margens, padding e tipografia nos viewports desktop (1440px) e mobile (375px), garantindo contraste da tarja amarela e alinhamento do seletor no header.

#### APIs expostas
- `POST /impersonate/company/{company}`: Inicia personificação da empresa.
- `POST /impersonate/stop`: Encerra a personificação ativa.
- `GET /api/companies/selectable`: Retorna a lista de empresas que o usuário autenticado pode selecionar para emitir.

#### APIs externas utilizadas
- Nenhuma.

#### Documentação das APIs consultadas
- Nenhuma fonte externa.

#### Eventos e outros contratos
- Evento `App\Events\UserImpersonated`: Disparado no início e fim de personificação para auditoria.

### 11. Estratégia TDD
- **Unidade**: Teste de isolamento da trait `BelongsToTenant` e cálculo de escopo do `HierarchicalTenantScope`.
- **Integração/contrato**: Testes HTTP simulando requests com e sem header `X-Impersonate-Company-Id`.
- **BDD/aceite**: Cenários AC-001 a AC-003 mapeados como testes no Pest.
- **Runner TDD**: Pest PHP (`vendor/bin/pest`).

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 | `tests/Feature/MultiTenancyTest.php` (`SPECSFY:AC-001`) | Pending | Pending | Pending |
| US-002, FR-001, NFR-001, AC-002 | AC-002 | `tests/Feature/ImpersonationTest.php` (`SPECSFY:AC-002`) | Pending | Pending | Pending |
| US-003, FR-002, NFR-002, AC-003 | AC-003 | `tests/Feature/CertificateGovernanceTest.php` (`SPECSFY:AC-003`) | Pending | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Feature | `tests/Feature/MultiTenancyTest.php` | Pending |
| FR-001 | AC-002 | Feature | `tests/Feature/ImpersonationTest.php` | Pending |
| FR-001 | AC-003 | Feature | `tests/Feature/CertificateGovernanceTest.php` | Pending |
| FR-002 | AC-001 | Feature | `tests/Feature/MultiTenancyTest.php` | Pending |
| FR-002 | AC-002 | Feature | `tests/Feature/ImpersonationTest.php` | Pending |
| FR-002 | AC-003 | Feature | `tests/Feature/CertificateGovernanceTest.php` | Pending |
| NFR-001 | AC-001 | Integração | `tests/Feature/MultiTenancyTest.php` | Pending |
| NFR-001 | AC-002 | Integração | `tests/Feature/ImpersonationTest.php` | Pending |
| NFR-001 | AC-003 | Integração | `tests/Feature/CertificateGovernanceTest.php` | Pending |
| NFR-002 | AC-001 | Feature | `tests/Feature/MultiTenancyTest.php` | Pending |
| NFR-002 | AC-002 | Feature | `tests/Feature/ImpersonationTest.php` | Pending |
| NFR-002 | AC-003 | Feature | `tests/Feature/CertificateGovernanceTest.php` | Pending |

### 13. Validações

#### Gate do Ato I — Definição
- **Resultado**: Passed
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/defined/0001-scaffolding-multi-tenancy/spec.md`
- **Achados**:
  - **FIND-PROD-001** [P2] [Resolved] — Cadastro direto de empresas pelo escritório confirmado.
  - **FIND-ARCH-001** [P1] [Resolved] — Personificação multi-aba com tarja persistente definida via header/contexto.
  - **FIND-SEC-001** [P1] [Resolved] — Auditoria de duplo contexto (usuário real vs personificado) e governança de certificado pelo escritório confirmadas.

#### Gate do Ato II — Plano
- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0001-scaffolding-multi-tenancy/spec.md`
- **Achados**: [Pending.]

#### Gate do Ato III — Entrega
- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/defined/0001-scaffolding-multi-tenancy/spec.md .`
- **Achados**: [Pending.]

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001 [TEST] [TDD] [US-001] Criar caso Pest falhando para isolamento de tenant em tests/Feature/MultiTenancyTest.php — Refs: US-001, FR-001, NFR-002, AC-001 — Depends: none
  - [ ] **PREP**: Ler AC-001 e definir setup de fixtures com 2 escritórios distintos.
  - [ ] **EXECUTE**: Escrever teste com marcador `SPECSFY:AC-001`.
  - [ ] **VERIFY**: Observar RED por falta dos models e scopes.
  - [ ] **VISUAL**: Não aplicável (teste de backend).
  - [ ] **EVIDENCE**: Registrar comando de execução e causa do RED.
  - [ ] **IMPROVE**: Garantir assertions claras de não-vazamento.

- [ ] T002 [TEST] [TDD] [US-002] Criar caso Pest falhando para personificação multi-aba em tests/Feature/ImpersonationTest.php — Refs: US-002, FR-001, NFR-001, AC-002 — Depends: none
  - [ ] **PREP**: Ler AC-002 e simular requisição com header de personificação.
  - [ ] **EXECUTE**: Escrever teste com marcador `SPECSFY:AC-002`.
  - [ ] **VERIFY**: Observar RED por falta do middleware e service.
  - [ ] **VISUAL**: Não aplicável (teste de backend).
  - [ ] **EVIDENCE**: Registrar comando e causa do RED.
  - [ ] **IMPROVE**: Testar tanto Super Admin quanto Operador de Escritório.

- [ ] T003 [TEST] [TDD] [US-003] Criar caso Pest falhando para governança de certificados em tests/Feature/CertificateGovernanceTest.php — Refs: US-003, FR-002, AC-003 — Depends: none
  - [ ] **PREP**: Ler AC-003 e preparar cenário com flag de upload desativada.
  - [ ] **EXECUTE**: Escrever teste com marcador `SPECSFY:AC-003`.
  - [ ] **VERIFY**: Observar RED por falta da policy.
  - [ ] **VISUAL**: Não aplicável (teste de backend).
  - [ ] **EVIDENCE**: Registrar comando e causa do RED.
  - [ ] **IMPROVE**: Validar mensagem amigável de erro 403.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T004 [CODE] [US-001] Implementar migrations e models base (Office, Company, User, company_user) — Refs: US-001, FR-001, AC-001 — Depends: T001
  - [ ] **PREP**: Confirmar campos em database schema.
  - [ ] **EXECUTE**: Criar migrations e models com tipagem estrita PHP 8.3.
  - [ ] **VERIFY**: Executar migrate e validar constraints.
  - [ ] **VISUAL**: Não aplicável.
  - [ ] **EVIDENCE**: Registrar schema e saída do migrate.
  - [ ] **IMPROVE**: Adicionar UUIDs como chave primária padrão.

- [ ] T005 [CODE] [US-001] Implementar HierarchicalTenantScope e Trait BelongsToTenant — Refs: US-001, FR-001, NFR-002, AC-001 — Depends: T004
  - [ ] **PREP**: Revisar resolução do scope com os 3 níveis.
  - [ ] **EXECUTE**: Implementar scope global e injetar no model Company.
  - [ ] **VERIFY**: Rodar T001 e confirmar GREEN no isolamento.
  - [ ] **VISUAL**: Não aplicável.
  - [ ] **EVIDENCE**: Registrar comando de teste passando.
  - [ ] **IMPROVE**: Otimizar query do scope com index no office_id.

- [ ] T006 [CODE] [US-002] Implementar ImpersonationManager e Middleware EnsureTenantContext — Refs: US-002, FR-001, NFR-001, AC-002 — Depends: T005
  - [ ] **PREP**: Definir header X-Impersonate-Company-Id e fallback de sessão.
  - [ ] **EXECUTE**: Implementar serviço e middleware com compartilhamento no Inertia.
  - [ ] **VERIFY**: Rodar T002 e confirmar GREEN na personificação.
  - [ ] **VISUAL**: Não aplicável.
  - [ ] **EVIDENCE**: Registrar saída dos testes HTTP.
  - [ ] **IMPROVE**: Sanitizar header para evitar injeção de ID inválido.

- [ ] T007 [CODE] [US-003] Implementar Policy de governança de certificados A1 — Refs: US-003, FR-002, AC-003 — Depends: T006
  - [ ] **PREP**: Ler a flag allow_client_certificate_upload na Company.
  - [ ] **EXECUTE**: Implementar CompanyPolicy@uploadCertificate.
  - [ ] **VERIFY**: Rodar T003 e confirmar GREEN no bloqueio/liberação.
  - [ ] **VISUAL**: Não aplicável.
  - [ ] **EVIDENCE**: Registrar testes passando.
  - [ ] **IMPROVE**: Mensagem de erro em português padronizada.

#### Fase 3 — Interface para Pessoas (Inertia React)
- [ ] T008 [CODE] [US-002] Implementar componente ImpersonationBanner e CompanySwitcher no Shell — Refs: US-002, FR-001, AC-002 — Depends: T006
  - [ ] **PREP**: Confirmar props compartilhadas do Inertia no HandleInertiaRequests.
  - [ ] **EXECUTE**: Criar ImpersonationBanner.tsx e CompanySwitcher.tsx.
  - [ ] **VERIFY**: Testar renderização com personificação ativa e inativa.
  - [ ] **VISUAL**: Conferir tarja em amarelo de advertência, contraste e botão de saída no topo da tela.
  - [ ] **EVIDENCE**: Screenshot e inspeção de layout.
  - [ ] **IMPROVE**: Adicionar atalho de teclado para alternar empresas.

#### Fase 4 — Qualidade e Regressão
- [ ] T009 [TEST] Executar regressão completa e conferência de rastreabilidade — Refs: US-001, US-002, US-003, AC-001, AC-002, AC-003 — Depends: T007, T008
  - [ ] **PREP**: Executar suite inteira de testes Feature e Unit.
  - [ ] **EXECUTE**: vendor/bin/pest.
  - [ ] **VERIFY**: 100% dos testes verdes.
  - [ ] **VISUAL**: Conferir shell com visualização responsiva.
  - [ ] **EVIDENCE**: Registrar comandos e resultados.
  - [ ] **IMPROVE**: Registrar retrospectiva da entrega da Spec 0001.

### 15. Ordem de execução
- Caminho crítico: T001/T002/T003 → T004 → T005 → T006 → T007 → T008 → T009.
- Tarefas paralelas: T001, T002 e T003 podem ser criadas em paralelo.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
- Nenhuma (base isolada do projeto).

#### Riscos
- **Risco de vazamento de contexto em abas paralelas** → Mitigado com prioridade de contexto via header `X-Impersonate-Company-Id` sobre a sessão global.
- **Risco de operador do escritório emitir por empresa desativada** → Mitigado com validação de status `ACTIVE` no scope.

#### Suposições
- O escritório contábil assume a responsabilidade fiscal pelos certificados das empresas que gerencia.

### 17. Decisões
- **DEC-001**: O contexto de personificação suporta header HTTP para garantir isolamento multi-aba sem que uma aba desconfigure o cliente da outra.
- **DEC-002**: A delegação de upload do certificado A1 é controlada pelo escritório via flag booleana na empresa, oferecendo flexibilidade conforme o perfil de cada cliente.
- **DEC-003**: A numeração sequencial e emissão grava o ID do operador real e o contexto personificado para resguardo jurídico perante a Receita Federal.

### 18. Definition of Done
- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC-001` a `AC-003` passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes automatizados no Pest executam com 100% de sucesso.
