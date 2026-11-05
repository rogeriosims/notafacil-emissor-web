# Domínio — FiscalFlow

> Gerado pelo agente Data Master / Archaeologist em 2026-11-05.  
> Entidades, Agregados, Regras de Invariância e Contratos para porte a Laravel.

---

## Mapa de Domínio

```
FiscalFlow é uma plataforma SaaS multi-tenant de emissão de NFS-e (Nota Fiscal
de Serviço Eletrônica) voltada a escritórios contábeis brasileiros.

Domínios principais:
  ├─ Identity & Multi-Tenancy   (Office, User, Invite)
  ├─ Fiscal Emitter             (Company, Certificate, FiscalConfig)
  ├─ Service Catalog            (ServiceItem, ServiceType, Taxonomy)
  ├─ Borrower Management        (Borrower, Address)
  ├─ Invoice Lifecycle          (Invoice, InvoiceBatch, InvoicePayload)
  ├─ Tax Calculation            (TaxEngine, RetentionLogic)
  └─ Fiscal Provider            (IFiscalProvider, ACBrProvider, FiscalProviderFactory)
```

---

## Agregados e Entidades

### Agregado: `Office` (Escritório Contábil)
**Raiz de agregado — isolamento de tenant.**

```
Office {
  id: UUID
  name: string                       // Razão social
  cnpj?: string                      // CNPJ sem máscara
  status: 'ACTIVE' | 'SUSPENDED'
  subscription: OfficeSubscription {
    planId: UUID
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIAL'
    cycleStart: date
    nextBillingDate: date
    currentUsage: int                // Notas emitidas no ciclo
  }
}
```

**Invariantes:**
- Um `Office` SUSPENDED não pode emitir novas notas fiscais.
- `currentUsage` deve ser incrementado a cada nota AUTHORIZED.
- `monthly_quota` do plano é o limite; ultrapassar gera cobrança por overage.

---

### Agregado: `Company` (Empresa Emitente)
**Vinculada a um Office. É a emitente de NFS-e.**

```
Company {
  id: UUID
  officeId: UUID                     // FK → Office
  name: string
  cnpj: string                       // 14 dígitos, único por office
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  environment: 'homologacao' | 'producao'
  taxRegime: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL'
  
  // Configuração tributária detalhada
  regTrib: RegTrib {
    opSimpNac: 1 | 2 | 3             // 1=Geral, 2=MEI, 3=Simples
    regEspTrib: 0..6
    regApTribSN?: 1 | 2 | 3 | null  // somente se opSimpNac=3
  }
  
  // Configuração RPS (Recibo Provisório de Serviços)
  rps: RpsConfig {
    lote: int
    serie: string
    numero: int
  }
  
  // Integração fiscal
  fiscalProvider: 'acbr' | string
  providerCompanyId?: string
  
  // Certificado digital A1
  certificate: CertificateInfo {
    hasCertificate: boolean
    expirationDate?: date
    thumbprint?: string
    subject?: { cnpj, commonName }
  }
  
  // Endereço com ibgeCode obrigatório para emissão
  address: Address {
    cep, street, number, neighborhood,
    city, state, ibgeCode, complement?
  }
  
  cityHall?: { login, senha, token }  // Credenciais prefeitura
  taxIncentive: boolean
  issRate: decimal                   // Alíquota ISS padrão
}
```

**Invariantes:**
- `cnpj` UNIQUE por `office_id`.
- Não pode emitir notas enquanto `status != 'ACTIVE'`.
- `certificate.hasCertificate = true` é pré-requisito para emissão.
- `address.ibgeCode` é obrigatório para emissão (campo-chave do DPS).
- `regTrib.regApTribSN` só pode ser não-nulo se `opSimpNac === 3`.
- Quando `opSimpNac === 2` (MEI), ISS NUNCA é retido.

---

### Entidade: `ServiceItem` (Item do Catálogo de Serviços)
**Pertence a uma Company. Configura as regras fiscais do serviço.**

```
ServiceItem {
  id: UUID
  companyId: UUID                    // FK → Company
  serviceTypeId: UUID                // FK → ServiceType (cTribNac)
  taxonomyId?: UUID                  // FK → TaxTaxonomyMaster (NBS)
  
  description: string
  unitPrice: decimal
  issAliquot: decimal                // Alíquota ISS (ex: 5.00 = 5%)
  
  // Código tributário municipal (máx 5 chars — opcional)
  municipalTaxCode?: string          // cTribMun
  
  // Código NBS override (desnormalizado)
  nbs?: string
  
  // Hierarquia de retenção
  allowRetention: boolean            // Level 1 — master switch
  snRetentionSubject?: boolean       // Level 5a — Simples Nacional
  generalRegimeRetentionSubject?: boolean // Level 5b — Regime Geral
}
```

**Invariantes:**
- Se `allowRetention = false`, NENHUM outro nível pode forçar retenção.
- `issAliquot` entre 0 e 100.
- `municipalTaxCode` máximo 5 caracteres.

---

### Value Object: `ServiceType` (Tipo de Serviço Nacional)
**Tabela de referência — LC116. Imutável.**

```
ServiceType {
  id: UUID
  cTribNac: string                   // 6 dígitos (ex: "170101")
  description: string
  issDueAtExecution: boolean
  allowsDeduction: boolean
  defaultNbs?: string
  mandatoryRetentionSuggestion: boolean
}
```

---

### Value Object: `TaxTaxonomyMaster` (NBS — Nomenclatura Brasileira de Serviços)
**Hierarquia de classificação fiscal. Imutável. Auto-referenciada.**

```
TaxTaxonomyMaster {
  id: UUID
  parentId?: UUID                    // FK → self (autorreferência)
  code: string                       // Agrupador LC116 (ex: "1.05")
  nbs?: string                       // Código NBS (ex: "1.05.01.00")
  description: string
  hierarchyLevel: int                // 0=raiz, 1=capítulo, ...
  isLeaf: boolean
}
```

---

### Agregado: `Borrower` (Tomador de Serviço)
**Vinculado a uma Company. Representa o cliente da empresa.**

```
Borrower {
  id: UUID
  companyId: UUID                    // FK → Company
  taxId: string                      // CPF (11 dígitos) ou CNPJ (14 dígitos)
  name: string
  email?: string
  phone?: string
  municipalRegistration?: string     // Inscrição Municipal
  issWithheld: boolean               // Nível 3 da hierarquia de retenção
  address: Address {                 // ibgeCode OBRIGATÓRIO
    cep, street, number,
    complement?, neighborhood,
    city, state, ibgeCode
  }
}
```

**Invariantes:**
- `(companyId, taxId)` UNIQUE — um tomador por CNPJ/CPF por empresa.
- `taxId` deve ter exatamente 11 (CPF) ou 14 (CNPJ) dígitos numéricos.
- `address.ibgeCode` obrigatório para emissão DPS.
- Dados do tomador DEVEM ser imutabilizados em `borrower_snapshot` no momento da emissão.

---

### Agregado: `Invoice` (Nota Fiscal)
**Entidade central do domínio. Ciclo de vida gerenciado por máquina de estados.**

```
Invoice {
  id: UUID
  companyId: UUID                    // FK → Company
  batchId?: UUID                     // FK → InvoiceBatch (emissão em lote)
  
  // Dados do tomador (desnormalizados + snapshot)
  borrowerName: string
  borrowerCnpj: string               // CPF ou CNPJ
  borrowerSnapshot: BorrowerSnapshot // Imutável no momento da emissão
  
  // Valores
  amount: decimal                    // Valor bruto
  discountAmount: decimal            // Desconto incondicionado
  
  // Impostos (calculados no momento da criação)
  issAliquot: decimal
  issAmount: decimal
  issWithheld: boolean
  issSnapshot: IssSnapshot           // Imutável — auditoria fiscal
  
  // Serviço
  serviceCode: string                // cTribNac
  description?: string
  
  // Estado e rastreabilidade
  status: InvoiceStatus
  environment: 'homologacao' | 'producao'
  fiscalProvider?: string
  providerInvoiceId?: string
  verificationCode?: string
  accessKey?: string
  
  // Arquivos
  pdfUrl?, xmlUrl?, cancelXmlUrl?, cancelPdfUrl?: string
  cancellationData?: { id, codigo, motivo, data_hora }
  
  // Auditoria
  logs: InvoiceLog[]
  issuedAt: datetime
  competenceDate: datetime
  updatedAt: datetime
}
```

**Máquina de Estados:**
```
DRAFT ──────→ CREATED ──────→ PROCESSING ─────→ AUTHORIZED ──→ CANCELING ──→ CANCELED
  │                               │                   │
  └───────────────────────────────┴──────→ ERROR      │
                                                       └──────→ DENIED
```

**Invariantes:**
- Notas AUTHORIZED, PROCESSING e CANCELED NÃO podem ser excluídas fisicamente (trigger DB).
- Uma vez em CANCELING, não pode retornar a AUTHORIZED.
- `issSnapshot` e `borrowerSnapshot` são imutáveis após a emissão — NUNCA atualizar.
- `amount > 0` obrigatório.
- `issAliquot` entre 0 e 100.
- `competenceDate` obrigatório para emissão.

---

### Entidade: `InvoiceBatch` (Lote de Importação)
**Agrupa notas importadas via planilha.**

```
InvoiceBatch {
  id: UUID
  companyId: UUID
  name: string
  status: 'OPEN' | 'PROCESSING' | 'COMPLETED' | 'ARCHIVED'
  totalRecords: int
  processedCount: int                // Notas criadas com sucesso
  errorCount: int                    // Linhas com falha
  createdAt: datetime
}
```

---

### Entidade: `InvoicePayload` (Auditoria de Comunicação Fiscal)
**Log imutável de todos os payloads trocados com o provedor fiscal.**

```
InvoicePayload {
  id: UUID
  invoiceId: UUID
  direction: 'sent' | 'received'
  payload: JSON                      // Raw payload sem transformação
  createdAt: datetime
}
```

---

## Value Objects Compartilhados

### `Address`
```
Address {
  cep: string                        // 8 dígitos numéricos
  street: string
  number: string                     // Aceita "S/N"
  complement?: string
  neighborhood: string
  city: string
  state: string                      // Sigla UF (2 chars)
  ibgeCode: string                   // Código IBGE do município
}
```

### `IssSnapshot` (imutável)
```
IssSnapshot {
  pAliq: decimal                     // Alíquota ISS (%)
  vISSQN: decimal                    // Valor ISS calculado
  vBC: decimal                       // Base de cálculo
  vDesc: decimal                     // Desconto
  cTribNac_usado: string             // Código tributário nacional usado
  cTribMun_usado?: string            // Código tributário municipal
  nbs_usado?: string                 // Código NBS
  tpRetISSQN_calculado: 1 | 2        // 1=não retém, 2=retém
  vLiq: decimal                      // Valor líquido
  origem_aliquota: string            // Rastreabilidade da alíquota
  origem_retencao: string            // Rastreabilidade da retenção
}
```

---

## Serviços de Domínio

### `TaxCalculationService`
**Calcula ISS e monta o snapshot fiscal.**

```
Entrada:  quantity, unitPrice, discount, issRate, serviceItem, company, borrower
Saída:    { grossAmount, baseCalc, issRate, issValue, netAmount, isRetained, issSnapshot }

Contrato:
- Sempre imutabilizar resultado em issSnapshot
- issRate nunca negativo
- baseCalc = max(0, grossAmount - discount)
- netAmount = isRetained ? (baseCalc - issValue) : baseCalc
```

### `RetentionDecisionService`
**Aplica a hierarquia de 5 níveis para decidir retenção do ISS.**

```
Entrada:  company (com regTrib), borrower (com issWithheld), serviceItem
Saída:    boolean (retém ou não), string (fonte da decisão)

Hierarquia:
  L1: serviceItem.allowRetention = false → false (SOURCE: SERVICE)
  L2: company.regTrib.opSimpNac = 2     → false (SOURCE: PROVIDER/MEI)
  L3: borrower.issWithheld = true       → true  (SOURCE: BORROWER)
  L4: [reservado — regra municipal]
  L5a: opSimpNac=3 AND sn_retention_subject     → true  (SOURCE: COMBO)
  L5b: opSimpNac=1 AND general_regime_retention → true  (SOURCE: COMBO)
  DEFAULT:                                         false
```

### `BorrowerLookupService` (somente em Batch)
**Resolve tomador com cadeia de fallback:**

```
1. Cache em memória (batch session)
2. Banco local (borrowers)
3. API CNPJ (nf-lookup-cnpj) — apenas PJ
4. API CEP (nf-lookup-cep) — se ibgeCode não resolvido
5. Municípios DB por nome (municipalities ILIKE)
6. ERRO — ibgeCode obrigatório
```

### `FiscalProviderFactory`
**Singleton que resolve qual implementação de IFiscalProvider usar.**

```
Variável de ambiente: FISCAL_PROVIDER = 'acbr' (padrão)
Implementações disponíveis: ACBrProvider
Padrão: Ports & Adapters — IFiscalProvider é o port; ACBrProvider é o adapter
```

---

## Regras de Negócio Essenciais

### RN-01 — Isolamento de Tenant
Todo dado (empresa, nota, tomador, serviço) pertence a um único `office_id`. Nenhum dado cruza fronteiras de tenant via aplicação — reforçado por RLS no Supabase.

### RN-02 — Pré-requisitos de Emissão
Para emitir qualquer NFS-e:
1. `company.status === 'ACTIVE'`
2. `company.certificate.hasCertificate === true`
3. `company.address.ibgeCode` preenchido
4. `company.environment` definido (homologação ou produção)

### RN-03 — Imutabilidade de Snapshots
Após transição para qualquer status ≠ DRAFT, `iss_snapshot` e `borrower_snapshot` NUNCA devem ser modificados. São a prova fiscal auditável do que foi calculado no momento da emissão.

### RN-04 — Proteção contra Exclusão
Notas com status `AUTHORIZED`, `PROCESSING` ou `CANCELED` não podem ser excluídas do banco. Apenas `DRAFT` e `ERROR` podem ser removidas.

### RN-05 — MEI Nunca Retém ISS
Empresa com `regTrib.opSimpNac = 2` (MEI) NUNCA retém ISS, independentemente de qualquer outra configuração. Esta é a regra de maior prioridade após o master switch do serviço.

### RN-06 — Padrão DPS: pAliq
Quando a alíquota ISS for 0 ou negativa, `pAliq` deve ser OMITIDO do XML do DPS. Enviá-lo com valor 0 causa erro E0600 na ACBr.

### RN-07 — Código Tributário Obrigatório
Toda nota requer ao menos `cTribNac` (6 dígitos). `cTribMun` e `NBS` são opcionais, mas recomendados para municípios integrados ao Portal Nacional.

### RN-08 — Tomador: ibgeCode Obrigatório
O endereço do tomador deve conter `ibgeCode` para geração do DPS. A importação em lote bloqueia notas sem resolução de IBGE.

### RN-09 — UNIQUE por Tomador/Empresa
`(company_id, tax_id)` deve ser único na tabela `borrowers`. Duplicatas são resolvidas via UPSERT (atualiza dados; não cria novo registro).

### RN-10 — Quota de Notas por Plano
O escritório tem uma cota mensal de notas (`subscription.monthly_quota`). Notas adicionais geram cobrança pelo `overage_price` do plano. O controle é feito em `subscription.currentUsage`.

---

## Contratos de Integração (Ports)

### Port: `IFiscalProvider`
Interface que abstrai qualquer provedor fiscal. Implementações: `ACBrProvider` (ativa), `MockProvider` (testes).

### Port Externo: CNPJ API
- Edge Function `nf-lookup-cnpj`
- Fallback: ACBr sandbox → Invertexto
- Retorna: `{ name, tradeName, address: { street, number, neighborhood, city, state, cep, ibgeCode } }`

### Port Externo: CEP API
- Edge Function `nf-lookup-cep`
- Retorna: `{ street, neighborhood, city, state, ibgeCode }`

### Port Externo: ACBr API v3.1.9
- Endpoint configurado via variável de ambiente `ACBR_BASE_URL`
- Autenticação via `acbrAuth.ts`
- Responsável por: emissão, cancelamento, download de arquivos, consulta de status

---

## Glossário de Termos de Domínio

| Termo | Significado |
|-------|-------------|
| NFS-e | Nota Fiscal de Serviço Eletrônica |
| DPS | Documento Padrão de Serviço — formato XML nacional para NFS-e |
| cTribNac | Código Tributário Nacional — 6 dígitos (LC116) |
| cTribMun | Código Tributário Municipal — máx 5 chars |
| NBS | Nomenclatura Brasileira de Serviços |
| ISS | Imposto Sobre Serviços |
| RPS | Recibo Provisório de Serviços |
| opSimpNac | Opção pelo Simples Nacional: 1=Geral, 2=MEI, 3=Simples |
| regEspTrib | Regime Especial de Tributação (0-6) |
| regApTribSN | Regime de Apuração do Simples Nacional (1-3) |
| tpRetISSQN | Tipo de retenção do ISS: 1=não retém, 2=retém |
| pAliq | Percentual da alíquota ISS (campo do XML DPS) |
| vBC | Valor da Base de Cálculo |
| vISSQN | Valor do ISS Calculado |
| vLiq | Valor Líquido (após dedução do ISS retido) |
| Tomador | Empresa/pessoa que contrata o serviço (borrower) |
| Prestador | Empresa que presta o serviço e emite a nota (company) |
| IBGE | Instituto Brasileiro de Geografia e Estatística — código de município |
| ACBr | Automação Comercial Brasil — provedor fiscal atual |
| Portal Nacional | Portal nacional da NFS-e do governo federal |
| MEI | Microempreendedor Individual |
| DANFSE | Documento Auxiliar da NFS-e (PDF) |
