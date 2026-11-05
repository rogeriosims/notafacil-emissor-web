# Stack Tecnológica — FiscalFlow

> Gerado pelo **reversa-scout** em 2026-11-05. Fase: reconhecimento.

---

## Visão Geral

FiscalFlow é uma plataforma SaaS multi-tenant de emissão de Notas Fiscais de Serviço Eletrônicas (NFS-e). A arquitetura segue o padrão **BFF (Backend For Frontend)** com frontend React (SPA) e backend composto inteiramente por **Supabase Edge Functions** (Deno/TypeScript). A camada fiscal adota **Arquitetura Hexagonal** (Ports & Adapters) para isolar o provedor fiscal.

---

## Frontend

| Aspecto | Detalhe |
|---------|---------|
| Framework | **React 18.2** |
| Linguagem | **TypeScript 5.2** (strict mode, noImplicitAny) |
| Build tool | **Vite 5.1** |
| Roteamento | **React Router DOM 6.22** (centralizado em `src/routes.tsx`) |
| Estilização | **Tailwind CSS 3.4** + `clsx` + `tailwind-merge` |
| Formulários | **React Hook Form 7.51** + **Zod 3.22** (validação de schemas) |
| Gráficos | **Recharts 2.12** |
| Ícones | **lucide-react 0.344** |
| Datas | **date-fns 3.3** |
| Deploy | **Vercel** (configuração em `vercel.json`) |

### Estrutura de Pastas (Frontend)

```
src/
├── App.tsx                  ← Raiz: providers + AppRoutes
├── routes.tsx               ← Roteamento centralizado (lazy load + PermissionGuard)
├── index.tsx                ← Bootstrap React (mount #root)
├── types.ts / types/        ← Tipos globais (Role, User, Invoice, Company…)
├── constants.ts             ← Constantes da aplicação
├── lib/supabase.ts          ← Cliente Supabase instanciado
├── config/navigation.ts     ← Mapeamento de rotas para sidebar
├── contexts/                ← AuthContext, OfficeContext, ToastContext
├── hooks/                   ← Custom hooks (useInvoiceForm, useBatchUpload…)
├── services/                ← Camada de acesso a dados (Supabase + Edge Functions)
├── schemas/                 ← Schemas Zod (entitySchemas, issuanceSchemas)
├── pages/                   ← Páginas por rota (lazy loaded)
├── components/              ← Componentes por domínio (invoices, companies, ui…)
└── utils/                   ← Helpers (dashboardHelpers)
```

---

## Backend (Supabase Edge Functions)

| Aspecto | Detalhe |
|---------|---------|
| Runtime | **Deno** (Edge Functions Supabase) |
| Linguagem | **TypeScript** (strict, noImplicitAny — via `supabase/deno.json`) |
| Auth | **Supabase Auth** (JWT, roles via `app_metadata`) |
| Database | **PostgreSQL** gerenciado pela Supabase (RLS habilitado) |
| Armazenamento | **Cloudflare R2** (PDFs, XMLs, certificados A1, logos) |
| Padrão fiscal | **Hexagonal / Ports & Adapters** (ver seção Camada Fiscal) |

### Edge Functions (18 funções)

| Função | Domínio | Descrição |
|--------|---------|-----------|
| `issue-invoice` | NFS-e | Emissão via ACBr Provider |
| `cancel-invoice` | NFS-e | Cancelamento de nota |
| `check-invoice-status` | NFS-e | Consulta de status na prefeitura |
| `delete-invoice` | NFS-e | Deleção de rascunho |
| `batch-import-drafts` | Lote | Importação via XLSX |
| `upload-invoice-files` | Documentos | Upload de XML/PDF para R2 |
| `get-document-url` | Documentos | URL assinada para PDF/XML |
| `manage-company` | Empresas | CRUD com configuração fiscal |
| `nf-upload-certificate` | Certificados | Upload certificado A1 |
| `nf-decode-certificate` | Certificados | Decodificação A1 |
| `nf-delete-certificate` | Certificados | Remoção de certificado |
| `nf-update-config` | Config Fiscal | Atualização de config da empresa |
| `nf-manage-logo` | Empresas | Upload/remoção de logo no R2 |
| `nf-lookup-cep` | Utilitários | Consulta endereço por CEP |
| `nf-lookup-cnpj` | Utilitários | Consulta dados de CNPJ |
| `invite-user` | Usuários | Convite por e-mail |
| `revoke-access` | Usuários | Revogação de acesso |

---

## Camada Fiscal (Hexagonal / Ports & Adapters)

```
supabase/functions/_shared/fiscal/
├── interfaces/IFiscalProvider.ts     ← Porta (contrato agnóstico)
├── fiscalProviderFactory.ts          ← Factory — resolve o provider ativo
├── types/fiscalTypes.ts              ← DTOs fiscais
├── mappers/invoiceMapper.ts          ← Mapeamento domínio → DTO ACBr
├── providers/acbr/
│   ├── acbrProvider.ts               ← Adaptador ACBr (implementa IFiscalProvider)
│   ├── acbrHttpClient.ts             ← HTTP Client para ACBr Middleware
│   └── acbrAuth.ts                   ← Autenticação ACBr
└── utils/currencyParser.ts           ← Parser de moeda
```

**Provider ativo:** ACBr Middleware (REST)
**Provider futuro:** Configurável via `FiscalProviderFactory.getProvider()` — basta implementar `IFiscalProvider`

---

## Banco de Dados

| Aspecto | Detalhe |
|---------|---------|
| SGBD | PostgreSQL (Supabase managed) |
| Migrations | 9 arquivos SQL em `supabase/migrations/` |
| Segurança | Row Level Security (RLS) por role |
| Roles | `PLATFORM_ADMIN`, `OFFICE_ADMIN`, `CLIENT_ADMIN`, `USER` |

---

## Testes

| Aspecto | Detalhe |
|---------|---------|
| Framework | Custom runner `tsx` (Node) compatível com Deno |
| Arquivos de teste | 6 arquivos `*_test.ts` em `supabase/functions/_shared/fiscal/tests/` |
| Cobertura estimada | Camada fiscal (backend) — zero testes de frontend identificados |
| Suítes | provider, batch_import, issue_invoice, company_config, acbr_schema (unitários) + acbr_e2e (integração real) |

---

## AI / LLM

| Aspecto | Detalhe |
|---------|---------|
| SDK | `@google/genai` (Gemini) |
| Uso | `src/services/geminiService.ts` — assistência inteligente no produto |

---

## Plataforma Alvo (Migração)

Conforme `.reversa/state.json`: **Laravel** (target_platform). O projeto atual (legado a ser analisado) é React + Supabase/Deno. A migração prevista é para uma stack Laravel.
