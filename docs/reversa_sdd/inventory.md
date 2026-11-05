# Inventário de Superfície — FiscalFlow

> Gerado pelo **reversa-scout** em 2026-11-05.  
> Level: `completo` (conforme `.reversa/state.json`).

---

## Resumo Executivo

| Item | Valor |
|------|-------|
| Linguagem primária | TypeScript |
| Framework frontend | React 18 + Vite 5 |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Total arquivos (excluindo node_modules/dist) | ~311 |
| Edge Functions | 18 funções |
| Páginas React | 35+ (lazy loaded) |
| Hooks customizados | 18 |
| Services | 20 |
| Migrations SQL | 9 |
| Arquivos de teste | 6 |
| Plataforma alvo (migração) | Laravel |

---

## Mapa de Arquivos por Domínio

### Frontend — `src/`

#### Páginas (`src/pages/`) — 35 arquivos `.tsx`

| Arquivo | Domínio |
|---------|---------|
| `Dashboard.tsx` | Dashboard |
| `Login.tsx` | Auth |
| `UpdatePassword.tsx` | Auth |
| `UserProfile.tsx` | Usuários |
| `InvoiceIssue.tsx` | NFS-e (emissão) |
| `InvoiceList.tsx` | NFS-e |
| `InvoiceDetail.tsx` | NFS-e |
| `BatchList.tsx` | Lote |
| `BatchUpload.tsx` | Lote |
| `BatchDetail.tsx` | Lote |
| `BorrowerList.tsx` | Tomadores |
| `BorrowerCreate.tsx` | Tomadores |
| `BorrowerEdit.tsx` | Tomadores |
| `ServiceList.tsx` | Catálogo de Serviços |
| `ServiceForm.tsx` | Catálogo de Serviços |
| `ServiceTypeList.tsx` | Tipos de Serviço (admin) |
| `ServiceTypeForm.tsx` | Tipos de Serviço (admin) |
| `ServiceCodeList.tsx` | Códigos de Serviço (admin) |
| `ServiceCodeForm.tsx` | Códigos de Serviço (admin) |
| `MunicipalityList.tsx` | Municípios (admin) |
| `MunicipalityForm.tsx` | Municípios (admin) |
| `PlanList.tsx` | Planos SaaS (admin) |
| `PlanForm.tsx` | Planos SaaS (admin) |
| `Management.tsx` | Gestão multi-tenant |
| `CompanyCreate.tsx` | Empresas |
| `CompanyEdit.tsx` | Empresas |
| `CompanyOnboardingWizard.tsx` | Onboarding de empresa |
| `CertificateOnboarding.tsx` | Certificados digitais |
| `OfficeCreate.tsx` | Escritórios |
| `OfficeEdit.tsx` | Escritórios |
| `SubscriptionView.tsx` | Assinaturas |
| `admin/TaxSettings.tsx` | Configurações fiscais (admin) |

#### Hooks Customizados (`src/hooks/`) — 18 arquivos `.ts`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `useInvoiceForm.ts` | Estado e validação do formulário de emissão |
| `useInvoiceIssue.ts` | Submissão de emissão |
| `useInvoiceList.ts` | Listagem e filtros de notas |
| `useInvoiceDetail.ts` | Carregamento de detalhes de nota |
| `useInvoiceData.ts` | Dados auxiliares de nota |
| `useInvoiceActions.ts` | Ações (cancelar, deletar, baixar) |
| `useInvoiceCancel.ts` | Fluxo de cancelamento |
| `useInvoiceTaxes.ts` | Cálculo de impostos |
| `useBatchUpload.ts` | Upload e processamento de lote |
| `useBatchDetail.ts` | Detalhes de lote |
| `useBorrowerCreate.ts` | Criação de tomador |
| `useBorrowerEdit.ts` | Edição de tomador |
| `useCompanyCreate.ts` | Criação de empresa |
| `useCompanyEdit.ts` | Edição de empresa |
| `useCompanyOnboarding.ts` | Fluxo de onboarding |
| `useOfficeCreate.ts` | Criação de escritório |
| `useManagement.ts` | Painel de gestão multi-tenant |
| `useAddressAutoFill.ts` | Autopreenchimento de endereço via CEP |
| `useMunicipalityForm.ts` | Formulário de municípios |
| `useServiceForm.ts` | Formulário de serviços |

#### Services (`src/services/`) — 20 arquivos `.ts`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `authService.ts` | Login, logout, sessão |
| `invoiceService.ts` | CRUD de notas no Supabase |
| `issuanceService.ts` | Orquestra emissão (chama Edge Function) |
| `batchService.ts` | Importação em lote |
| `borrowerService.ts` | CRUD de tomadores |
| `companyService.ts` | CRUD de empresas |
| `officeService.ts` | CRUD de escritórios |
| `serviceService.ts` | CRUD de serviços do catálogo |
| `serviceTypeService.ts` | CRUD de tipos de serviço |
| `serviceCodeService.ts` | CRUD de códigos de serviço |
| `municipalityService.ts` | CRUD de municípios |
| `userService.ts` | Gestão de usuários e permissões |
| `profileService.ts` | Perfil do usuário logado |
| `certificateService.ts` | Gerenciamento de certificados A1 |
| `cepService.ts` | Lookup de CEP |
| `cnpjService.ts` | Lookup de CNPJ |
| `storageService.ts` | Upload/download R2 |
| `subscriptionService.ts` | Assinaturas e planos |
| `taxonomyService.ts` | Dados fiscais de taxonomia |
| `retentionLogic.ts` | Regras de retenção fiscal |
| `nuvemFiscalService.ts` | Serviço legado (Nuvem Fiscal) |
| `geminiService.ts` | Integração com Gemini AI |
| `issuance/taxEngine.ts` | Motor de cálculo de impostos (ISS, PIS, COFINS, CSLL, IR) |

#### Componentes por Domínio (`src/components/`)

| Pasta | Componentes |
|-------|------------|
| `ui/` | Button, Card, ConfirmationDialog, FormInput, LoadingSpinner, Toast |
| `invoices/` | BorrowerEditModal, CancelInvoiceModal |
| `invoices/details/` | InvoiceEditForm, InvoiceHeader, InvoiceSidebar, InvoiceTaxSummary, InvoiceTimeline |
| `issuance/` | BorrowerQuickCreateModal, BorrowerSelector, FinancialSummary, PayloadInspectorModal, ServiceSelection |
| `companies/` | CompanyCertificateManager, CompanyFiscalTab, CompanyFormSections, CompanySwitcherModal, EnvironmentSelector, OnboardingStepIndicator |
| `dashboards/` | ClientAdminDashboard, OfficeDashboard, OperationalDashboard, PlatformDashboard |
| `management/` | CompanyList, OfficeList, OfficeSettings, UserList |
| `offices/` | OfficeFormSections |
| `users/` | UserInviteModal |
| `inputs/` | NbsCombobox |

#### Schemas de Validação (`src/schemas/`)

| Arquivo | Schemas |
|---------|---------|
| `entitySchemas.ts` | Schemas Zod para entidades (Company, Office, Borrower, Service…) |
| `issuanceSchemas.ts` | Schemas Zod para o formulário de emissão de NFS-e |

#### Tipos (`src/types/`)

| Arquivo | Tipos exportados |
|---------|----------------|
| `types.ts` (raiz) | `Role` enum, `User`, `AppUser` |
| `types/auth.ts` | Tipos de autenticação |
| `types/billing.ts` | Tipos de cobrança/planos |
| `types/borrower.ts` | Tipos de tomador de serviços |
| `types/common.ts` | Tipos comuns compartilhados |
| `types/company.ts` | Tipos de empresa |
| `types/invoice.ts` | Tipos de NFS-e |
| `types/municipality.ts` | Tipos de município |
| `types/service.ts` | Tipos de serviço |

---

### Backend — `supabase/`

#### Edge Functions (18 funções)

```
supabase/functions/
├── _shared/
│   ├── cors.ts                         ← CORS handler unificado
│   ├── response.ts                     ← Envelope HTTP padronizado
│   ├── supabaseClient.ts               ← Cliente Supabase service role
│   ├── r2Client.ts                     ← Cloudflare R2 client
│   └── fiscal/
│       ├── interfaces/IFiscalProvider.ts     ← Porta hexagonal
│       ├── fiscalProviderFactory.ts          ← Factory de providers
│       ├── types/fiscalTypes.ts              ← DTOs fiscais
│       ├── mappers/invoiceMapper.ts          ← Mapeamento domínio → ACBr
│       ├── providers/acbr/
│       │   ├── acbrProvider.ts               ← Adaptador ACBr
│       │   ├── acbrHttpClient.ts             ← HTTP Client ACBr
│       │   └── acbrAuth.ts                   ← Auth ACBr
│       ├── utils/currencyParser.ts           ← Parser de moeda
│       └── tests/
│           ├── provider_test.ts
│           ├── batch_import_test.ts
│           ├── issue_invoice_test.ts
│           ├── company_config_test.ts
│           ├── acbr_schema_test.ts
│           └── acbr_e2e_test.ts
├── issue-invoice/index.ts
├── cancel-invoice/index.ts
├── check-invoice-status/index.ts
├── delete-invoice/index.ts
├── batch-import-drafts/index.ts
├── upload-invoice-files/index.ts
├── get-document-url/index.ts
├── manage-company/index.ts
├── nf-upload-certificate/index.ts
├── nf-decode-certificate/index.ts
├── nf-delete-certificate/index.ts
├── nf-update-config/index.ts
├── nf-manage-logo/index.ts
├── nf-lookup-cep/index.ts
├── nf-lookup-cnpj/index.ts
├── invite-user/index.ts
├── revoke-access/index.ts
└── upload-invoice-files/index.ts
```

#### Migrations SQL (`supabase/migrations/`) — 9 arquivos

| Arquivo | Conteúdo |
|---------|---------|
| `20241214_fix_invoice_payloads_rls.sql` | Fix de RLS em invoice_payloads |
| `20241217_prevent_authorized_invoice_deletion.sql` | Constraint: impede deleção de nota autorizada |
| `20251213220714_remote_schema.sql` | Schema remoto completo (snapshot principal) |
| `20251217_fix_auth_triggers.sql` | Correção de triggers de autenticação |
| `20251222_add_canceling_status.sql` | Novo status ENUM: `canceling` |
| `20251223181959_add_cancellation_files.sql` | Tabela para arquivos de cancelamento |
| `20260128_fix_invoice_status_constraint.sql` | Fix de constraint de status |
| `20260301_agnostic_fiscal_provider.sql` | Coluna provider-agnóstica (fase hexagonal) |
| `20260916_add_agnostic_fiscal_columns.sql` | Novas colunas para provider agnóstico |

---

## Estrutura de Diretórios Completa (simplificada)

```
fiscalflow/
├── .reversa/                      ← Estado do framework Reversa
│   ├── state.json                 ← Fase atual, configurações
│   └── context/
│       └── surface.json           ← Este mapeamento (formato JSON)
├── _reversa_sdd/                  ← Documentação gerada (SDD)
│   ├── inventory.md               ← Este arquivo
│   ├── stack.md                   ← Stack tecnológica
│   ├── entrypoints.md             ← Pontos de entrada
│   └── dependencies.md            ← Dependências
├── .agents/skills/                ← Skills do framework Reversa
├── docs/                          ← Documentação manual (ADRs, agentes)
├── openspec/                      ← Change proposals (specs)
│   ├── changes/                   ← Propostas em andamento e arquivadas
│   └── specs/                     ← Specs por domínio (cancellation, retry)
├── src/                           ← Código-fonte frontend React
├── supabase/                      ← Backend (Edge Functions + migrations)
├── package.json                   ← Dependências e scripts NPM
├── tsconfig.json                  ← Config TypeScript frontend
├── vite.config.ts                 ← Config Vite
├── vercel.json                    ← Deploy Vercel
└── AGENTS.md                      ← Regras de desenvolvimento para agentes
```

---

## Cobertura de Testes

| Camada | Framework | Arquivos | Observação |
|--------|-----------|---------|------------|
| Fiscal (backend) | tsx custom runner | 6 `*_test.ts` | Unitários + 1 E2E real |
| Frontend | — | 0 | Sem testes de componente ou página |

**Lacuna crítica:** zero cobertura de testes no frontend React.

---

## Sinais de Organização Detectados

1. **Roteamento centralizado** em `src/routes.tsx` → sinal `endpoint`
2. **Pastas por domínio** em `src/pages/`, `src/services/`, `src/components/`, `supabase/functions/` → sinal `module`
3. **Sugestão Scout:** granularidade **hybrid** (endpoint + module com peso equivalente)
