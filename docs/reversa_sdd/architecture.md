# Arquitetura — FiscalFlow (AS-IS)

> Documento gerado em conformidade com o framework Reversa para suporte à migração para Laravel.  
> Modelo C4 (Contexto C4-L1 e Containers C4-L2).

---

## 1. Diagrama C4 — Nível 1: Contexto de Sistema

Mostra os atores humanos, o FiscalFlow e os sistemas e órgãos externos com os quais interage.

```mermaid
flowchart TD
    subgraph Atores["Atores / Usuários"]
        UserAcc["Contador / Administrador do Escritório\n(Office Admin)"]
        UserCli["Cliente do Escritório / Emitente\n(Company User)"]
    end

    subgraph Sistema["Fronteira do Sistema: FiscalFlow"]
        FF["FiscalFlow SaaS\n(Gestão multi-tenant, motor de retenção e orquestração fiscal)"]
    end

    subgraph Externos["Sistemas & Gateways Externos"]
        ACBr["Gateway Fiscal ACBr API\n(Transmissão de DPS e autorização NFS-e)"]
        ADN["Ambiente de Dados Nacional (ADN)\n/ Prefeituras Integradas"]
        GovAPIs["ReceitaWS / BrasilAPI / ViaCEP\n(Consultas públicas de CNPJ e CEP)"]
        R2["Cloudflare R2\n(Storage S3 de PDFs e XMLs fiscais)"]
    end

    UserAcc -->|"Configura empresas, certificados e monitora notas"| FF
    UserCli -->|"Emite notas avulsas e lotes de DPS"| FF

    FF -->|"Gera DPS e transmite via IFiscalProvider"| ACBr
    ACBr -->|"Comunica e protocola NFS-e"| ADN
    FF -->|"Enriquece cadastros com dados cadastrais e IBGE"| GovAPIs
    FF -->|"Armazena e distribui DANFSE e XMLs"| R2
```

---

## 2. Diagrama C4 — Nível 2: Containers de Software

Visão detalhada da topologia atual em execução (React SPA + Supabase Serverless + PostgreSQL).

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Browser)"]
        SPA["React 18 + Vite SPA\n(Tailwind CSS, TanStack Query, React Hook Form)"]
    end

    subgraph Backend["Supabase Serverless Cloud"]
        Kong["API Gateway / Kong Reverse Proxy\n(Roteamento e Autenticação JWT)"]
        
        subgraph EdgeFunctions["Supabase Edge Functions (Deno / TypeScript)"]
            EF_Issue["issue-invoice\n(Orquestração da DPS, Snapshot e Envio)"]
            EF_Batch["batch-import-drafts\n(Importação assíncrona de planilhas)"]
            EF_Status["check-invoice-status\n(Polling e sincronização de notas)"]
            EF_Cancel["cancel-invoice\n(Cancelamento legal com sincronização)"]
            EF_Cert["nf-upload-certificate / decode\n(Gestão de certificados A1)"]
            EF_Shared["_shared/fiscal\n(Ports & Adapters: IFiscalProvider -> ACBrProvider)"]
        end

        subgraph Database["PostgreSQL 15 (Supabase DB)"]
        	DB_Tables[("Tabelas de Domínio\noffices, companies, invoices,\nborrowers, service_items")]
        	DB_Payloads[("Auditoria Fiscal\ninvoice_payloads (sent/received)")]
        	DB_RLS["Políticas RLS\n(Isolamento estrito office_id/company_id)"]
        end

        Storage["Supabase Storage & Cloudflare R2\n(Certificados A1 e Documentos Fiscais)"]
    end

    subgraph ExternalServices["APIs de Terceiros"]
        ACBr_API["ACBr API Cloud v3.1.9\n(DPS Padrão Nacional)"]
    end

    SPA -->|"HTTPS / REST / JWT"| Kong
    Kong -->|"Roteia requisições dinâmicas"| EdgeFunctions
    Kong -->|"PostgREST direto com RLS"| Database
    
    EF_Issue -->|"Consome contrato agnóstico"| EF_Shared
    EF_Batch -->|"Cria rascunhos em lote"| Database
    EF_Status -->|"Atualiza status e links de PDF"| Database
    EF_Shared -->|"REST HTTPS / mTLS"| ACBr_API
    EF_Issue -->|"Persiste snapshots e payloads"| Database
    EF_Cert -->|"Lê e valida PKCS#12"| Storage
```

---

## 3. Principais Módulos do Sistema e suas Responsabilidades

1. **Camada de Apresentação (React):** Gerencia fluxos de emissão rápida, wizards de onboarding via certificado, dashboards com KPIs e listagens com paginação.
2. **Motor de Regras Tributárias (Frontend & Functions):**
   - `taxEngine.ts`: Realiza os cálculos preliminares em memória para feedback imediato na UI.
   - `retentionLogic.ts`: Avalia a hierarquia de 5 níveis de retenção de ISS.
3. **Módulo Fiscal Hexagonal (`_shared/fiscal`):**
   - Porta agnóstica (`IFiscalProvider`): Define 11 operações padrão (emissão, consulta, cancelamento, certificado, etc.).
   - Adaptador concreto (`ACBrProvider`): Traduz o modelo de domínio do FiscalFlow para o schema estrito da ACBr API v3.1.9.
4. **Camada de Persistência (PostgreSQL + RLS):**
   - Garante segregação multi-tenant por meio de `auth.uid()` associado ao `office_id`.
   - Utiliza campos `JSONB` (`borrower_snapshot`, `iss_snapshot`) para congelar o estado fiscal no momento da emissão.
