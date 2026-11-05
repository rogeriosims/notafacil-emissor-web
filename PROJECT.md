# Contexto do Projeto: Nota Fácil Emissor Web (FiscalFlow Laravel)

## Finalidade e Visão
O **Nota Fácil Emissor Web** é a plataforma SaaS multi-tenant em Laravel 11 voltada para escritórios de contabilidade e empresas clientes emitirem Notas Fiscais de Serviços Eletrônicas (NFS-e) no **Padrão Nacional (SNNFSe)** com inteligência tributária, alta resiliência e integração transparente com a **API ACBr v3.1.9**.

O sistema substitui o monolito serverless anterior (React + Supabase/Deno) por um monolito modular robusto em PHP 8.3/Laravel com frontend em **Inertia.js (React 18)**.

## Bounded Contexts Principais
1. **Multi-Tenancy & Identity:** Isolamento estrito de escritórios (`Office`), empresas emitentes (`Company`) e operadores (`User`).
2. **Fiscal Domain & Engine:** Cálculo matemático e regras de retenção municipal (ISS) e tributos federais (INSS, IRRF, CSRF) em conformidade estrita com a **ADR 005** (dispensa de retenção $\le$ R$ 10,00 por fato gerador).
3. **Gateway Fiscal Hexagonal:** Ports & Adapters (`FiscalProviderInterface` -> `AcbrProvider`) garantindo total desacoplamento da prefeitura/ADN.
4. **Assincronia & Queues:** Emissão e importação em lote com outbox transacional e Redis Queues (`Bus::batch()`).

## Limites e Regras Inegociáveis
- **Single Source of Truth:** Cálculos tributários ocorrem **exclusivamente no backend Laravel** (`TaxEngineService`). Telas apenas simulam ou consomem resultados da API.
- **Isolamento de Tenant:** Todo model com escopo de tenant utiliza `TenantScope` global no Eloquent.
- **Imutabilidade:** Notas fiscais autorizadas possuem snapshots congelados (`borrower_snapshot`, `iss_snapshot`, `federal_taxes_snapshot`) e são imutáveis contra alteração ou exclusão direta.
