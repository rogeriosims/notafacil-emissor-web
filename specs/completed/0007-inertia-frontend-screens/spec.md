# Especificação integrada: Telas e Componentes em Inertia.js (React 18)

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0007 |
| Slug | 0007-inertia-frontend-screens |
| Status | Planned |
| Effort | 6 |
| Effort updated at | 2026-11-08 |
| Effort rationale | Porte e integração das páginas e componentes React 18 existentes no repositório legado para Inertia.js v2 no Laravel 11, cobrindo Dashboard, Listagem e Detalhe de Notas, Emissão Rápida com simulação de impostos, Lotes de Importação, Agendamento Recorrente e Governança de Certificado A1. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Sim |
| Atualizada em | 2026-11-08 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema
No sistema legado (SPA React + Supabase), as telas realizavam queries diretas no banco de dados via SDK do cliente e executavam regras fiscais no frontend, gerando divergências tributárias e violando o princípio de Single Source of Truth do backend (falha LOGIC-006). Além disso, a separação de repositórios causava atrito de deploy e perda de contexto de tenant multi-aba.

#### Resultado desejado
Uma camada de interface rica, fluida e reativa em **Inertia.js v2 + React 18 + Tailwind CSS** dentro do monolito Laravel 11:
1. Reaproveitamento dos componentes visuais validados do legado (Shadcn UI, Lucide Icons, Layout e Sidebar).
2. Eliminação total de cálculos fiscais no cliente: o formulário de emissão consulta `POST /api/invoices/simulate` para obter base de cálculo, ISS e retenções diretamente do `TaxEngineService`.
3. Isolamento multi-tenant visual com o `ImpersonationBanner` e `CompanySwitcherModal` consumindo as props compartilhadas pelo middleware `HandleInertiaRequests`.
4. Gestão de Certificado Digital A1 com validação da policy `uploadCertificate` (bloqueando empresas sem permissão do escritório).
5. Acompanhamento em tempo real do processamento de lotes e emissão de notas.

#### Métricas de sucesso
- 100% dos cálculos exibidos em tela provindos exclusivamente do motor fiscal backend.
- Zero quebras de estilo visual em relação ao design system do sistema legado.
- Carregamento inicial de página SPA sem recarregamento completo de navegador (navegação cliente via Inertia router).

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: O Inertia.js v2 permite manter toda a árvore de componentes React (`pages/` e `components/`) intacta, recebendo dados através do método `Inertia::render()` dos controllers Laravel.
- **R-002**: O Vite com plugin `@vitejs/plugin-react` compila os arquivos `.tsx` mantendo hot module replacement (HMR) durante o desenvolvimento.
- **R-003**: As chamadas assíncronas de simulação fiscal em tempo real utilizam a API REST interna com `axios` ou `fetch` mantendo o estado do formulário React Hook Form.

#### Fontes e contexto consultados
- Componentes e páginas em `/home/rogerio/Projetos/fiscalflow/src/`.
- `_reversa_sdd/entrypoints.md` e `_reversa_sdd/design-system.md`.
- `.specsfy/RULES.md` e `PROJECT.md`.

#### Documentação consultada
- Documentação do Inertia.js v2: `inertiajs.com`.
- Guia do Tailwind CSS v4 / Vite plugin.

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: Precisamos reescrever os componentes de UI (botões, modais, inputs)? → **A**: Não, os componentes base do Shadcn UI existentes em `src/components/ui/` são portados diretamente para `resources/js/Components/UI/`.
- **Q**: Como o usuário troca de empresa ativa? → **A**: O componente `CompanySwitcher` faz um post para `/api/set-impersonation` e o Inertia atualiza a página automaticamente com o novo contexto.

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Configuração do Inertia no Laravel (`inertiajs/inertia-laravel`, `@inertiajs/react`, `app.blade.php`, `app.tsx`, `vite.config.js`).
- Layout padrão da aplicação (`AppLayout.tsx`, `Sidebar.tsx`, `Header.tsx`, `ImpersonationBanner.tsx`).
- Telas principais:
  - `Dashboard/Index.tsx`
  - `Invoices/Index.tsx`, `Invoices/Create.tsx`, `Invoices/Show.tsx`
  - `Batches/Index.tsx`, `Batches/Create.tsx`
  - `Schedules/Index.tsx`
  - `Companies/Onboarding.tsx`, `Certificates/Upload.tsx`
- Controllers web (`DashboardController`, `InvoiceWebController`, `BatchWebController`, `ScheduleWebController`).
- Testes com Pest validando a renderização de todas as rotas web do Inertia e compartilhamento de props.

#### Fora de escopo
- Relatórios avançados de auditoria e paridade E2E (Spec 0008).

#### Atores
- `Super Admin`: Gerencia escritórios e personifica empresas.
- `Faturista do Escritório`: Emite notas, faz upload de lotes e gerencia carteira de clientes.
- `Cliente da Empresa`: Consulta suas notas emitidas e faz upload de certificado caso autorizado.

### 4. Princípios e restrições do projeto
- **PR-001**: O frontend nunca deve executar matemática tributária de ISS ou tributos federais; todo valor exibido é espelho do backend.
- **PR-002**: A navegação entre páginas deve utilizar o componente `<Link>` do Inertia para manter o comportamento SPA de alta fluidez.
- **PR-003**: O contexto de impersonation deve ser exibido em todas as páginas quando ativo.

### 5. Histórias de usuário

#### US-001 — Visualização de Dashboard e Gestão Multi-Tenant (P1)
Como faturista, desejo acessar o painel principal com métricas da empresa selecionada e alternar entre clientes com clareza visual de impersonation.

#### US-002 — Emissão de Notas com Prévia Tributária Confiável (P1)
Como faturista, desejo preencher formulários de emissão com preenchimento assistido e visualização antecipada de impostos calculados pelo backend antes da transmissão.

#### US-003 — Gestão de Lotes, Agendamentos e Certificados (P1)
Como operador, desejo enviar arquivos de lotes, programar faturamentos recorrentes e sincronizar o certificado digital da empresa de forma intuitiva.

### 6. Cenários BDD de aceite

#### AC-001 — Renderização do Dashboard com Métricas e Contexto de Tenant
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-001
Feature: Dashboard e Navegacao Multi-Tenant

  Scenario: Acesso ao dashboard autenticado com empresa ativa
    Given que um usuario de escritorio esta autenticado
    And possui uma empresa selecionada no contexto
    When acessa a rota "/dashboard"
    Then a resposta deve renderizar o componente Inertia "Dashboard/Index"
    And as props compartilhadas devem conter os dados do usuario e active_company_id
```

#### AC-002 — Formulário de Emissão com Simulação Dinâmica de Impostos
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-002
Feature: Emissao com Simulacao Fiscal no Backend

  Scenario: Renderizacao da tela de emissao de nota fiscal
    Given que o operador acessa "/invoices/create"
    When a pagina carrega
    Then deve renderizar o componente Inertia "Invoices/Create"
    And conter campos de tomador, servico municipal e discriminacao
    And consumir simulacao da API sem realizar calculos no frontend
```

#### AC-003 — Listagem de Notas Fiscais com Ações de Duplicação e Cancelamento
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-003
Feature: Listagem de Notas Fiscais

  Scenario: Visualizacao de listagem de notas filtradas por empresa
    Given que existem notas fiscais vinculadas a empresa ativa
    When o usuario acessa "/invoices"
    Then deve renderizar o componente Inertia "Invoices/Index"
    And listar as notas com status badges e acoes de download de XML, PDF e duplicacao
```

#### AC-004 — Upload de Planilhas em Lote e Agendamento Recorrente
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-004
Feature: Lotes e Agendamentos no Frontend

  Scenario: Acesso a tela de upload de lote
    Given que o faturista acessa "/batches/create"
    When a pagina e solicitada
    Then deve renderizar o componente Inertia "Batches/Create"
    And permitir envio de arquivos xlsx e csv com limite de 300 linhas
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve integrar o Inertia.js v2 no Laravel 11 com suporte a componentes React 18 e Vite.
- **FR-002**: O sistema deve fornecer controladores Inertia para Dashboard, Notas Fiscais, Lotes, Agendamentos e Certificados.
- **FR-003**: O sistema deve compartilhar dados de autenticação e contexto de impersonation automaticamente via middleware `HandleInertiaRequests`.

#### Não funcionais
- **NFR-001**: As transições de tela devem operar no padrão SPA sem recarregamento completo da página.
- **NFR-002**: Toda interface deve ser responsiva e utilizar as classes do Tailwind CSS v4 já consagradas no design system.

#### Erros e casos-limite
- Tentativa de acesso sem empresa ativa -> redirecionar para seleção de empresa.
- Sessão expirada -> Inertia lida com status 409/401 redirecionando para a tela de login.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
A branch `main` possui todas as APIs REST, motor tributário, adapters fiscais e modelos de dados com suporte a PostgreSQL.

#### Arquitetura e módulos
- `inertiajs/inertia-laravel` no Composer.
- `@inertiajs/react` no Node.js.
- `resources/views/app.blade.php`: Template raiz com `@viteReactRefresh`, `@vite(['resources/js/app.tsx', 'resources/css/app.css'])` e `@inertiaHead` / `@inertia`.
- `resources/js/app.tsx`: Entrypoint Inertia com resolução dinâmica de páginas.
- `resources/js/Layouts/AppLayout.tsx`: Shell comum com Sidebar e Banner de Impersonation.
- Controllers Web em `app/Http/Controllers/Web/`.

#### Migrations
*Nenhuma migration necessária nesta spec.*

#### Models
*Nenhum model novo nesta spec.*

#### Controllers e casos de uso
- `DashboardController`: Renderiza `Dashboard/Index`.
- `InvoiceWebController`: Renderiza `Invoices/Index`, `Invoices/Create`, `Invoices/Show`.
- `BatchWebController`: Renderiza `Batches/Index`, `Batches/Create`.
- `ScheduleWebController`: Renderiza `Schedules/Index`.

#### Views e experiência
Views SPA elegantes com tipografia Inter, paleta Slate/Emerald e ícones Lucide.

#### Estrutura de arquivos
- `resources/views/app.blade.php`
- `resources/js/app.tsx`
- `resources/js/Layouts/AppLayout.tsx`
- `resources/js/Pages/Dashboard/Index.tsx`
- `resources/js/Pages/Invoices/Index.tsx`
- `resources/js/Pages/Invoices/Create.tsx`
- `resources/js/Pages/Invoices/Show.tsx`
- `resources/js/Pages/Batches/Index.tsx`
- `resources/js/Pages/Batches/Create.tsx`
- `resources/js/Pages/Schedules/Index.tsx`
- `routes/web.php`
- `tests/Feature/InertiaFrontendRoutingTest.php`

### 9. Modelo de dados

#### Entidades
Consome os modelos Eloquent existentes via serialização em props dos controllers.

#### Estados e transições
Gerenciamento de estado de formulários via React local state / Inertia forms (`useForm`).

#### Migração e retenção
*Não aplicável.*

### 10. Interfaces e contratos

#### Interface para pessoas
Interface web completa para navegadores modernos (Chrome, Firefox, Safari, Edge).

#### Stack e convenções de interface
React 18 + TypeScript + Inertia.js + Tailwind CSS + Lucide React.

#### Telas e responsabilidades
- `Dashboard`: KPIs de faturamento e status de notas.
- `Invoices`: Tabela paginada com busca, filtros de status e botões de ação rápida.
- `Invoice Create`: Formulário unificado com cálculo automático de impostos via backend.

#### Fluxo de informação e navegação
Navegação via menu lateral com destaque da rota ativa.

#### Menus e navegação principal
O menu lateral (`Sidebar.tsx`) mapeia os seguintes itens e destinos:
- Dashboard: rota `/dashboard`
- Notas Fiscais: rota `/invoices`
- Nova Emissão: rota `/invoices/create`
- Importação em Lote: rota `/batches`
- Agendamentos: rota `/schedules`
- Configurações e Certificado: rota `/companies/settings`

#### Formulários e ações
Submissão assíncrona via `form.post()` com tratamento de erros de validação Laravel (`errors.field`).

#### Composição e disposição
Layout com barra lateral retrátil e área central com grid responsivo.

#### Blocos React e componentes selecionados
Cards de métrica, tabelas com ordenação, badges de status e modais de confirmação.

#### Estados e acessibilidade
Labels acessíveis em todos os campos de formulário e foco gerenciado em modais.

#### Contrato CRUD
As telas de listagem (`Invoices/Index.tsx`, `Batches/Index.tsx`) seguem o contrato padrão com PageHeader (título, subtítulo e botão de ação primária), DataGrid paginado exibindo o ID do registro com ordenação, botão de ação para editar ou visualizar detalhes e ação para apagar ou cancelar registros conforme as permissões de tenant.

#### Revisão visual durante o desenvolvimento
Inspeção visual contínua no navegador conferindo alinhamento de bordas, espaçamentos consistentes (sistema 4px/8px do Tailwind), margens harmônicas, padding interno em cards e tabelas, e tipografia legível (Inter/sans-serif com pesos regular, medium e semibold).

#### APIs expostas
Rotas web do Inertia (`GET /dashboard`, `GET /invoices`, `GET /invoices/create`, `GET /batches`, etc.).

#### APIs externas utilizadas
*Nenhuma externa direta do frontend; todo tráfego passa pelos controllers do Laravel.*

#### Documentação das APIs consultadas
Guia oficial do Inertia.js v2.

#### Eventos e outros contratos
*Não aplicável.*

### 11. Estratégia TDD
1. Escrever testes de roteamento Inertia em `tests/Feature/InertiaFrontendRoutingTest.php` validando o retorno de componentes e props (RED).
2. Instalar dependências Inertia e configurar `app.blade.php` e `app.tsx` (GREEN inicial).
3. Portar componentes e páginas React (GREEN completo).
4. Validar suíte de testes com Pest (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Tags `SPECSFY: AC-001`, `AC-002`, `AC-003`, `AC-004` nos testes de feature.

### 12. Plano de testes e rastreabilidade
- `InertiaFrontendRoutingTest.php` cobre AC-001 a AC-004 e FR-001 a FR-003.

### 13. Validações

#### Gate do Ato I — Definição
Passou (reaproveitamento do ecossistema React validado).

#### Gate do Ato II — Plano
Passou (arquitetura SPA com Inertia.js v2 estruturada).

#### Gate do Ato III — Entrega
Pendente (build do Vite e testes Pest passando).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Escrever testes com Pest para rotas Inertia em `tests/Feature/InertiaFrontendRoutingTest.php`.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T002: Adicionar pacotes Inertia no `composer.json` e `package.json`, criando `app.blade.php` e `resources/js/app.tsx`.
- [ ] T003: Portar componentes base de UI e o shell principal (`AppLayout.tsx`, `Sidebar.tsx`, `Header.tsx`).
- [ ] T004: Implementar páginas de Dashboard (`Dashboard/Index.tsx`) e Notas Fiscais (`Invoices/Index.tsx`, `Invoices/Create.tsx`, `Invoices/Show.tsx`).
- [ ] T005: Implementar páginas de Lotes (`Batches/Index.tsx`, `Batches/Create.tsx`) e Agendamento (`Schedules/Index.tsx`).
- [ ] T006: Criar controllers web e registrar rotas em `routes/web.php` protegidas por autenticação.

#### Fase 3 — Interface para Pessoas (Inertia React)
- [ ] T007: Compilar e validar assets via Vite (`npm run build`).

#### Fase 4 — Qualidade e Regressão
- [ ] T008: Executar suíte Pest e garantir 100% de sucesso nos testes de roteamento frontend.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Requer Node.js/NPM para build do Vite e controllers backend já implementados.

#### Riscos
Incompatibilidade de CSS Tailwind v3 para v4. Mitigação: importação limpa de estilos básicos e tokens de cor definidos.

#### Suposições
Assume-se que o usuário autenticado possui empresa associada para visualização do dashboard.

### 17. Decisões
- Uso estrito do Inertia.js v2 mantendo o React 18 existente.
- Cálculos tributários permanecem 100% no backend.

### 18. Definition of Done
- Build do Vite executando com sucesso (`npm run build`).
- 100% dos testes de feature do Inertia aprovados no Pest.
