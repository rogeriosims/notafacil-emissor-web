# Dependências — FiscalFlow

> Gerado pelo **reversa-scout** em 2026-11-05.  
> Fonte: `package.json` (frontend) + `supabase/deno.json` (Edge Functions).

---

## Dependências de Produção (Frontend — `npm`)

### Core React

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `react` | `^18.2.0` | Framework UI |
| `react-dom` | `^18.2.0` | Renderização DOM |
| `react-router-dom` | `^6.22.2` | Roteamento SPA (client-side) |

### Backend / BaaS

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `@supabase/supabase-js` | `^2.39.7` | Cliente Supabase (Auth, DB, Functions, Storage) |

### Formulários e Validação

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `react-hook-form` | `^7.51.0` | Gerenciamento de formulários performático |
| `@hookform/resolvers` | `^3.3.4` | Integração React Hook Form ↔ Zod |
| `zod` | `^3.22.4` | Validação de schemas TypeScript-first |

### UI e Estilização

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `tailwind-merge` | `^2.2.1` | Merge de classes Tailwind sem conflitos |
| `clsx` | `^2.1.0` | Utilitário condicional de classes CSS |
| `lucide-react` | `^0.344.0` | Biblioteca de ícones SVG |
| `recharts` | `^2.12.2` | Gráficos baseados em D3 para React |

### Utilitários

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `date-fns` | `^3.3.1` | Manipulação e formatação de datas |
| `xlsx` | `^0.18.5` | Leitura/escrita de arquivos XLSX (importação em lote) |
| `jszip` | `^3.10.1` | Compressão/descompressão ZIP (documentos fiscais) |

### AI / LLM

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `@google/genai` | `latest` | SDK Gemini — assistência inteligente no produto |

---

## Dependências de Desenvolvimento (Frontend)

### TypeScript e Tipos

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `typescript` | `^5.2.2` | Compilador TypeScript |
| `@types/react` | `^18.2.56` | Tipos React |
| `@types/react-dom` | `^18.2.19` | Tipos ReactDOM |

### Build e Bundler

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `vite` | `^5.1.4` | Bundler/dev server ultrarrápido |
| `@vitejs/plugin-react` | `^4.2.1` | Plugin React para Vite (SWC) |

### Estilização (Dev)

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `tailwindcss` | `^3.4.1` | Framework CSS utility-first |
| `autoprefixer` | `^10.4.18` | Prefixos CSS automáticos (PostCSS) |
| `postcss` | `^8.4.35` | Transformações CSS |

### Linting e Qualidade

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `eslint` | `^8.56.0` | Linter JavaScript/TypeScript |
| `@typescript-eslint/eslint-plugin` | `^8.69.0` | Regras ESLint para TypeScript |
| `@typescript-eslint/parser` | `^8.69.0` | Parser TypeScript para ESLint |
| `eslint-plugin-react-hooks` | `^4.6.0` | Regras de hooks React |
| `eslint-plugin-react-refresh` | `^0.4.5` | Compatibilidade com Fast Refresh |

### Execução de Scripts

| Pacote | Versão | Finalidade |
|--------|--------|-----------|
| `tsx` | `^4.23.13` | Executa arquivos TypeScript diretamente (Node.js) |

---

## Dependências Edge Functions (Deno — Runtime)

As Edge Functions Supabase rodam em **Deno** e importam dependências via URL (esm.sh / deno.land). Não há `package.json` para o backend — as dependências são resolvidas em tempo de execução.

### Dependências inferidas dos arquivos `_shared/`

| Módulo / Origem | Finalidade |
|----------------|-----------|
| `https://esm.sh/@supabase/supabase-js` | Acesso ao banco e Auth server-side |
| `Deno.env.get(...)` | Variáveis de ambiente (service_role_key, R2 credentials, ACBr URL) |
| `fetch` nativo Deno | HTTP Client para ACBr Middleware (REST) e APIs externas |

### Variáveis de Ambiente Necessárias

| Variável | Uso | Onde |
|----------|-----|------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Chave anon para cliente | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso admin nas Edge Functions | Edge Functions |
| `NF_PROD_CLIENT_ID` | ID cliente para provider fiscal | Edge Functions |
| `NF_PROD_CLIENT_SECRET` | Secret do provider fiscal | Edge Functions |
| `NF_SANDBOX_*` | Credenciais sandbox | Edge Functions |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key | Edge Functions |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key | Edge Functions |
| `R2_BUCKET_NAME` | Nome do bucket R2 | Edge Functions |
| `R2_ENDPOINT` | Endpoint S3-compatible do R2 | Edge Functions |
| `ACBR_MIDDLEWARE_URL` | URL do ACBr Middleware | Edge Functions |

---

## APIs Externas Consumidas

| Serviço | Finalidade | Fallback |
|---------|-----------|---------|
| **ACBr Middleware** | Emissão/cancelamento/status NFS-e | Sandbox ACBr |
| **ViaCEP** | Lookup de endereço por CEP | ACBr fallback |
| **Invertexto** | Lookup de CNPJ | Sandbox ACBr |
| **Cloudflare R2** | Armazenamento de arquivos (PDF, XML, certs, logos) | — |
| **Gemini API** (Google) | Assistência AI integrada ao produto | — |
| **Supabase Auth** | Autenticação e gerenciamento de sessões | — |

---

## Regras de Qualidade Aplicadas às Dependências

Conforme `AGENTS.md` e `supabase/deno.json`:

- **Proibido `any`** em todos os typings de payloads e retornos de API.
- **ESLint zero-warning** (`--max-warnings 0`) obrigatório antes de qualquer entrega.
- **Deno lint** (`deno lint`) obrigatório para Edge Functions.
- Dependência `@google/genai` com `"latest"` — **risco de breaking change** em atualizações futuras.
