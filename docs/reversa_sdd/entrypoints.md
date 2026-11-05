# Pontos de Entrada — FiscalFlow

> Gerado pelo **reversa-scout** em 2026-11-05.

---

## 1. Frontend — Inicialização da Aplicação

### `index.html` → `src/index.tsx` → `src/App.tsx`

```
index.html
└── <script type="module" src="/src/index.tsx">
    └── ReactDOM.createRoot('#root')
        └── <BrowserRouter>
            └── <App>
                ├── <AuthProvider>       (src/contexts/AuthContext.tsx)
                ├── <OfficeProvider>     (src/contexts/OfficeContext.tsx)
                ├── <ToastProvider>      (src/contexts/ToastContext.tsx)
                └── <AppRoutes>          (src/routes.tsx)
```

---

## 2. Roteamento Centralizado — `src/routes.tsx`

Todas as 35+ rotas da aplicação são declaradas em **um único arquivo** com:
- **Lazy loading** (`React.lazy`) de todas as páginas
- **PermissionGuard** com `allowedRoles` por Role enum

| Rota | Componente | Roles permitidos |
|------|-----------|-----------------|
| `/login` | `Login` | Público |
| `/update-password` | `UpdatePassword` | Público |
| `/` | `Dashboard` | Todos |
| `/profile` | `UserProfile` | Autenticado |
| `/issue` | `InvoiceIssue` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/invoices` | `InvoiceList` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/invoices/:id` | `InvoiceDetail` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/batches` | `BatchList` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/batches/new` | `BatchUpload` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/batches/:id` | `BatchDetail` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/borrowers` | `BorrowerList` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/borrowers/new` | `BorrowerCreate` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/borrowers/:id/edit` | `BorrowerEdit` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/services` | `ServiceList` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/services/new` | `ServiceForm` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/services/:id/edit` | `ServiceForm` | OFFICE_ADMIN, CLIENT_ADMIN, USER |
| `/management` | `Management` | PLATFORM_ADMIN, OFFICE_ADMIN, CLIENT_ADMIN |
| `/management/offices/new` | `OfficeCreate` | PLATFORM_ADMIN |
| `/management/offices/:id/edit` | `OfficeEdit` | PLATFORM_ADMIN |
| `/management/companies/new` | `CompanyOnboardingWizard` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/companies/:id/edit` | `CompanyEdit` | PLATFORM_ADMIN, OFFICE_ADMIN, CLIENT_ADMIN |
| `/management/onboarding-cert` | `CertificateOnboarding` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/municipalities` | `MunicipalityList` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/municipalities/new` | `MunicipalityForm` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/municipalities/:id/edit` | `MunicipalityForm` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/service-types` | `ServiceTypeList` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/service-types/new` | `ServiceTypeForm` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/service-types/:id/edit` | `ServiceTypeForm` | PLATFORM_ADMIN, OFFICE_ADMIN |
| `/management/service-codes` | `ServiceCodeList` | PLATFORM_ADMIN |
| `/management/service-codes/new` | `ServiceCodeForm` | PLATFORM_ADMIN |
| `/management/service-codes/:code/edit` | `ServiceCodeForm` | PLATFORM_ADMIN |
| `/management/plans` | `PlanList` | PLATFORM_ADMIN |
| `/management/plans/new` | `PlanForm` | PLATFORM_ADMIN |
| `/management/plans/:id/edit` | `PlanForm` | PLATFORM_ADMIN |
| `/admin/tax-settings` | `TaxSettings` | PLATFORM_ADMIN |
| `/subscription` | `SubscriptionView` | OFFICE_ADMIN |

---

## 3. Edge Functions — Endpoints HTTP (Supabase)

Cada Edge Function expõe um endpoint HTTP POST (ou OPTIONS para CORS). São invocadas via `supabase.functions.invoke()` pelo frontend ou diretamente por HTTP.

| Endpoint (URL relativa) | Arquivo | Propósito |
|------------------------|---------|-----------|
| `issue-invoice` | `supabase/functions/issue-invoice/index.ts` | Emissão de NFS-e |
| `cancel-invoice` | `supabase/functions/cancel-invoice/index.ts` | Cancelamento |
| `check-invoice-status` | `supabase/functions/check-invoice-status/index.ts` | Status na prefeitura |
| `delete-invoice` | `supabase/functions/delete-invoice/index.ts` | Deletar rascunho |
| `batch-import-drafts` | `supabase/functions/batch-import-drafts/index.ts` | Import em lote (XLSX) |
| `upload-invoice-files` | `supabase/functions/upload-invoice-files/index.ts` | Upload XML/PDF → R2 |
| `get-document-url` | `supabase/functions/get-document-url/index.ts` | URL assinada R2 |
| `manage-company` | `supabase/functions/manage-company/index.ts` | CRUD empresas |
| `nf-upload-certificate` | `supabase/functions/nf-upload-certificate/index.ts` | Upload certificado A1 |
| `nf-decode-certificate` | `supabase/functions/nf-decode-certificate/index.ts` | Decodificar certificado |
| `nf-delete-certificate` | `supabase/functions/nf-delete-certificate/index.ts` | Deletar certificado |
| `nf-update-config` | `supabase/functions/nf-update-config/index.ts` | Config fiscal empresa |
| `nf-manage-logo` | `supabase/functions/nf-manage-logo/index.ts` | Logo empresa no R2 |
| `nf-lookup-cep` | `supabase/functions/nf-lookup-cep/index.ts` | Lookup CEP |
| `nf-lookup-cnpj` | `supabase/functions/nf-lookup-cnpj/index.ts` | Lookup CNPJ |
| `invite-user` | `supabase/functions/invite-user/index.ts` | Convite por e-mail |
| `revoke-access` | `supabase/functions/revoke-access/index.ts` | Revogar acesso |

---

## 4. Shared Layer (Edge Functions)

Utilitários compartilhados por todas as Edge Functions:

| Arquivo | Responsabilidade |
|---------|-----------------|
| `_shared/cors.ts` | Headers CORS unificados (OPTIONS handler) |
| `_shared/response.ts` | Envelope padronizado `{ success, data }` / `{ success, error, code }` |
| `_shared/supabaseClient.ts` | Instância do cliente Supabase com service role key |
| `_shared/r2Client.ts` | Cliente Cloudflare R2 (upload/download de arquivos) |

---

## 5. Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `.env.example` | Variáveis de ambiente necessárias (template) |
| `.env` / `.env.local` | Configuração local (não versionado exceto .example) |
| `vite.config.ts` | Build config Vite — alias `@/` → `src/`, injeta `VITE_SUPABASE_URL` |
| `tsconfig.json` | TypeScript strict para frontend — exclui `supabase/` |
| `supabase/deno.json` | TypeScript + lint + fmt para Edge Functions |
| `tailwind.config.js` | Configuração Tailwind CSS |
| `postcss.config.js` | PostCSS (autoprefixer) |
| `.eslintrc.cjs` | ESLint TypeScript + React hooks |
| `vercel.json` | Configuração de deploy Vercel |

---

## 6. Scripts `package.json`

| Script | Comando | Propósito |
|--------|---------|-----------|
| `dev` | `vite` | Servidor de desenvolvimento |
| `build` | `tsc && vite build` | Build de produção |
| `lint` | `eslint src --ext .ts,.tsx --max-warnings 0` | Lint zero-warning |
| `lint:fix` | `eslint ... --fix` | Lint com correção automática |
| `type-check` | `tsc --noEmit` | Verificação de tipos |
| `check:all` | `type-check && test:fiscal` | Quality gate completo |
| `test:fiscal` | 5 suítes `tsx *_test.ts` | Testes unitários fiscais |
| `test:acbr-e2e` | `tsx acbr_e2e_test.ts` | Testes E2E reais (homologação ACBr) |
| `preview` | `vite preview` | Preview do build de produção |
