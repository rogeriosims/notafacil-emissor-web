# Análise de Código — FiscalFlow

> Gerado pelo agente Data Master / Archaeologist em 2026-11-05.  
> Extração de fluxos essenciais para porte a Laravel.

---

## 1. Motor de Cálculo de ISS — `taxEngine.ts`

**Arquivo:** `src/services/issuance/taxEngine.ts`

### Assinatura
```typescript
calculateInvoiceTaxes(
  quantity: number,
  unitPrice: number,
  discount: number,
  issRateInput: number,
  serviceItem: ServiceItem | null,
  provider: Company | null,
  borrower: Borrower | null
): TaxCalculationResult
```

### Algoritmo Passo a Passo

```
1. grossAmount   = quantity × unitPrice
2. baseCalc      = max(0, grossAmount − discount)
3. issRate       = issRateInput (alíquota em %)
4. isRetained    = calculateRetention(provider, borrower, serviceItem)
5. issValue      = (baseCalc × issRate) / 100
6. netAmount     = isRetained ? (baseCalc − issValue) : baseCalc
```

### Saída: `TaxCalculationResult`
```
{
  grossAmount,       // valor bruto
  baseCalculation,   // base de cálculo (após desconto)
  issRate,           // alíquota aplicada
  issValue,          // valor do ISS
  netAmount,         // valor líquido a receber
  isRetained,        // flag de retenção
  issSnapshot: {     // JSON persistido na nota para imutabilidade
    pAliq,           // alíquota
    vISSQN,          // valor ISS
    vBC,             // base de cálculo
    vDesc,           // desconto
    cTribNac_usado,  // código tributário nacional
    cTribMun_usado,  // código tributário municipal
    nbs_usado,       // código NBS
    tpRetISSQN_calculado, // 1=não retém, 2=retém
    vLiq,            // valor líquido
    origem_aliquota, // fonte da alíquota
    origem_retencao  // fonte da decisão de retenção
  }
}
```

---

## 2. Motor de Retenção — `retentionLogic.ts`

**Arquivo:** `src/services/retentionLogic.ts`

### Hierarquia de 5 Níveis (ordem de avaliação)

```
Nível 1 — SERVIÇO (master switch)
  └─ if (!serviceItem.allowRetention) → retém = false, fonte = 'SERVICE'

Nível 2 — REGIME DO PRESTADOR (MEI)
  └─ if (company.regTrib.opSimpNac === 2) → retém = false, fonte = 'PROVIDER'

Nível 3 — TOMADOR (flag explícita)
  └─ if (borrower.issWithheld === true) → retém = true, fonte = 'BORROWER'

Nível 4 — MUNICÍPIO (placeholder/futuro)
  └─ [reservado para regras municipais específicas]

Nível 5 — REGRA COMBINADA (regime × tipo de serviço)
  └─ if (opSimpNac === 3 && serviceItem.snRetentionSubject)              → retém = true
  └─ if (opSimpNac === 1 && serviceItem.generalRegimeRetentionSubject)   → retém = true
  └─ DEFAULT → retém = false
  └─ fonte = 'COMBO'
```

### Pseudo-código para Laravel
```php
function calculateRetention(Company $provider, Borrower $borrower, ServiceItem $service): bool
{
    // Nível 1 — master switch do serviço
    if (!$service->allow_retention) {
        return false; // fonte: SERVICE
    }

    $regime = $provider->reg_trib['opSimpNac'] ?? 1;

    // Nível 2 — MEI nunca retém
    if ($regime === 2) {
        return false; // fonte: PROVIDER
    }

    // Nível 3 — tomador retém explicitamente
    if ($borrower->iss_withheld) {
        return true; // fonte: BORROWER
    }

    // Nível 4 — município (futuro)
    // TODO: consultar regras do município do prestador

    // Nível 5 — regra combinada regime × serviço
    if ($regime === 3 && $service->sn_retention_subject)              return true;
    if ($regime === 1 && $service->general_regime_retention_subject)  return true;

    return false; // fonte: DEFAULT
}
```

---

## 3. Fluxo de Emissão de NFS-e

**Arquivo:** `supabase/functions/issue-invoice/index.ts`

### Sequência de Operações

```
[1] Validação de entrada
    └─ invoice_id obrigatório no body

[2] Busca da nota (auth client — RLS garante acesso)
    └─ invoices.select('*').eq('id', invoice_id)

[3] Busca da empresa
    └─ companies.select('*').eq('id', invoice.company_id)

[4] Validações de pré-emissão
    ├─ company.certificate.hasCertificate = true
    └─ company.address.ibgeCode != null

[5] Mapeamento: DB → InvoiceIssueInput
    └─ invoiceRecordToIssueInput(invoice, company.cnpj)

[6] Auditoria: salvar payload enviado
    └─ invoice_payloads.insert({ direction: 'sent', payload: issueInput })

[7] Atualizar status para PROCESSING
    └─ invoices.update({ status: 'PROCESSING', updated_at: now() })

[8] Chamar provedor fiscal
    └─ FiscalProviderFactory.getProvider().issueInvoice(issueInput)

[9] Auditoria: salvar resposta recebida
    └─ invoice_payloads.insert({ direction: 'received', payload: result })

[10] Atualizar nota com resultado
    └─ invoices.update({
         provider_invoice_id, acbr_id, nuvem_fiscal_id,
         fiscal_provider, status, verification_code, updated_at
       })

[11] Adicionar log de sucesso à nota
    └─ invoices.update({ logs: [...currentLogs, novoLog] })

[12] Resposta HTTP 200
    └─ { invoiceId, providerInvoiceId, status, protocolNumber, verificationCode, provider }

[ERR] Em caso de falha:
    ├─ invoice_payloads.insert({ direction: 'received', payload: { error } })
    ├─ invoices.update({ status: 'ERROR', updated_at })
    └─ invoices.update({ logs: [..., { level: 'ERROR', message: 'Falha na Emissão' }] })
```

---

## 4. Mapeamento: `invoiceRecordToIssueInput()`

**Arquivo:** `supabase/functions/_shared/fiscal/mappers/invoiceMapper.ts`

### Prioridade de Resolução de Campos

| Campo InvoiceIssueInput | Prioridade (maior → menor) |
|------------------------|---------------------------|
| `borrower.cpfCnpj` | `borrower_cnpj` → `borrower.cpf_cnpj` → `borrower_snapshot.cnpj` |
| `borrower.name` | `borrower_name` → `borrower.name` → `borrower_snapshot.nome` |
| `borrower.address` | `borrower.address` → `borrower_snapshot.endereco_completo` |
| `item.serviceCode` | `service_code` → `iss_snapshot.cTribNac_usado` → `service.code` → `'0107'` |
| `item.amount` | `amount` → `iss_snapshot.vBC` |
| `item.issRate` | `iss_aliquot` → `iss_snapshot.pAliq` → `service.iss_rate` |
| `documentType` | `document_type` → `'NFSE'` (default) |

---

## 5. Fluxo de Importação em Lote

**Arquivo:** `supabase/functions/batch-import-drafts/index.ts`

### Sequência de Operações

```
[1] Criar cabeçalho do lote (invoice_batches)
    └─ { company_id, name, total_records, status:'OPEN', processed_count:0, error_count:0 }

[2] Carregar contexto
    ├─ companies.select('*').eq('id', company_id)
    └─ service_items.select('*, service_types(ctribnac), tax_taxonomy_master(nbs)')
         .eq('company_id', company_id)

[3] Pré-busca em lote de tomadores (single query)
    └─ Coleta todos os CPF/CNPJs únicos da planilha
       borrowers.select('*').eq('company_id').in('tax_id', allTaxIds)
       → Carrega em Map<taxId, borrowerRecord>

[4] Processamento linha a linha
    Para cada row:
    
    [4a] TOMADOR — cache-first lookup
         SE (taxId em cache):
           └─ Reutiliza dados existentes (zero chamadas externas)
         SENÃO:
           └─ Monta endereço com dados da planilha (excelAddress)
           └─ Passo 1: CNPJ API (nf-lookup-cnpj) se PJ (14 dígitos)
                       → Enriquece nome e endereço
           └─ Passo 2: CEP API (nf-lookup-cep) se ibgeCode ainda não resolvido
                       → Enriquece logradouro, bairro, cidade, estado, ibgeCode
           └─ Passo 3: Fallback DB — municipalities.ilike('name', city)
                       → Resolve ibgeCode por nome de cidade
           └─ VALIDAÇÃO: ibgeCode obrigatório (lança erro se ausente)
           └─ UPSERT: borrowers.update/insert + cache atualizado

    [4b] SERVIÇO
         └─ Localiza no catálogo por cTribNac OU municipal_tax_code
         └─ Lança erro se não encontrado

    [4c] CÁLCULO FISCAL (inline, espelha retentionLogic.ts)
         amount   = parseCurrency(row.valor)
         issAliq  = service.iss_aliquot
         regime   = company.reg_trib.opSimpNac
         
         if (regime === 2):              mustRetain = false   // MEI
         elif (service.allow_retention):
           if (regime === 3 && sn_retention_subject): mustRetain = true
           if (regime === 1 && general_regime_retention_subject): mustRetain = true
         
         issAmount = (amount × issAliq) / 100
         vLiq      = mustRetain ? (amount − issAmount) : amount

    [4d] COMPETÊNCIA
         └─ Parseia "DD/MM/AAAA" ou ISO 8601
         └─ Obrigatório — erro se ausente

    [4e] Monta payload da nota com iss_snapshot + borrower_snapshot

[5] Inserção em chunks de 50 (invoice_batches → invoices)

[6] Atualizar métricas do lote
    └─ invoice_batches.update({ processed_count, error_count, total_records, status })
```

### Estrutura do CSV/Planilha Esperado

| Coluna | Obrigatório | Descrição |
|--------|-------------|-----------|
| `cpf_cnpj` | SIM | CPF (11) ou CNPJ (14) do tomador |
| `codigo_servico` | SIM | cTribNac ou municipal_tax_code |
| `valor` | SIM | Valor do serviço (aceita moeda BR: "R$ 1.000,00") |
| `competencia` | SIM | Data de competência ("DD/MM/AAAA" ou ISO) |
| `nome` | NÃO | Nome do tomador (sobrescrito por API CNPJ se PJ) |
| `descricao` | NÃO | Discriminação dos serviços |
| `cep` | NÃO | CEP (usado para lookup) |
| `rua`/`logradouro` | NÃO | Logradouro |
| `numero`/`n` | NÃO | Número (default "S/N") |
| `bairro` | NÃO | Bairro |
| `municipio`/`cidade` | NÃO | Cidade (fallback para IBGE) |
| `uf`/`estado` | NÃO | Estado |
| `inscricao_municipal`/`im` | NÃO | Inscrição Municipal |

---

## 6. Interface do Provedor Fiscal — `IFiscalProvider`

**Arquivo:** `supabase/functions/_shared/fiscal/interfaces/IFiscalProvider.ts`

### Contrato Completo

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `syncCompany()` | `CompanySyncInput` | `CompanySyncOutput` | Registra empresa no provedor |
| `updateFiscalConfig()` | `cnpj, FiscalConfigInput` | `void` | Atualiza configurações tributárias |
| `uploadCertificate()` | `cnpj, CertificateUploadInput` | `CertificateInfo` | Envia certificado A1 (base64 + senha) |
| `deleteCertificate()` | `cnpj` | `void` | Remove certificado |
| `manageLogo()` | `cnpj, logoUrl?` | `void` | Envia/atualiza logotipo |
| `issueInvoice()` | `InvoiceIssueInput` | `InvoiceIssueOutput` | Emite NFS-e/NF-e/NFC-e |
| `checkInvoiceStatus()` | `providerInvoiceId` | `InvoiceStatusOutput` | Consulta status na prefeitura |
| `cancelInvoice()` | `providerInvoiceId, InvoiceCancelInput` | `InvoiceCancelOutput` | Cancela nota autorizada |
| `downloadInvoiceFiles()` | `providerInvoiceId` | `InvoiceFilesOutput` | Baixa XML + PDF |
| `lookupCnpj()` | `cnpj` | `CnpjDataOutput` | Consulta cadastral CNPJ |
| `lookupCep()` | `cep` | `CepDataOutput` | Consulta endereço por CEP |

### `InvoiceIssueInput` — Payload de Emissão
```typescript
{
  invoiceId: string;        // UUID da nota no banco local
  companyCpfCnpj: string;   // CNPJ do prestador (somente dígitos)
  borrower: {
    cpfCnpj: string;        // CPF/CNPJ do tomador (somente dígitos)
    name: string;
    email?: string;
    phone?: string;
    address?: {
      street, number, complement, neighborhood,
      city, state, cep, ibgeCode
    }
  };
  items: [{
    description: string;
    serviceCode: string;    // cTribMun / NBS
    amount: number;
    issRate?: number;
    issAmount?: number;
    deductionAmount?: number;
  }];
  totalAmount: number;
  competenceDate?: string;  // ISO 8601
  comments?: string;
  documentType?: 'NFSE' | 'NFE' | 'NFCE';  // default: 'NFSE'
}
```

---

## 7. Factory do Provedor Fiscal

**Arquivo:** `supabase/functions/_shared/fiscal/fiscalProviderFactory.ts`

### Comportamento
- Singleton por execução (instância única via `static instance`)
- Lê variável de ambiente `FISCAL_PROVIDER` (padrão: `'acbr'`)
- Atualmente: apenas `ACBrFiscalProvider` disponível (Nuvem Fiscal removida)
- `resetProvider()` para testes

### Implementação ACBr
- **Arquivos:** `providers/acbr/acbrProvider.ts`, `acbrHttpClient.ts`, `acbrAuth.ts`
- Comunicação com ACBr API v3.1.9
- Autenticação via `acbrAuth.ts` (token/credenciais)

---

## 8. Geração de DPS (Documento Padrão de Serviço)

### Campos-chave do XML DPS

| Campo XML | Fonte no banco | Descrição |
|-----------|---------------|-----------|
| `cTribNac` | `service_items.service_types.ctribnac` | 6 dígitos — código nacional LC116 |
| `cTribMun` | `service_items.municipal_tax_code` | Código municipal (max 5 chars) |
| `NBS` | `service_items.nbs` ou `tax_taxonomy_master.nbs` | Nomenclatura Brasileira de Serviços |
| `pAliq` | `invoices.iss_snapshot.pAliq` | Alíquota ISS (%) |
| `vISSQN` | `invoices.iss_snapshot.vISSQN` | Valor ISS calculado |
| `tpRetISSQN` | `invoices.iss_snapshot.tpRetISSQN_calculado` | 1=não retém, 2=retém |
| `vBC` | `invoices.iss_snapshot.vBC` | Base de cálculo |
| `opSimpNac` | `companies.reg_trib.opSimpNac` | Regime do prestador |
| `regEspTrib` | `companies.reg_trib.regEspTrib` | Regime especial |
| `cMunFG` | `companies.address.ibgeCode` | Código IBGE do município do prestador |

**Regra `pAliq` omitido:** Quando `issRate <= 0` (MEI / Simples Nacional isento), `pAliq` é omitido do XML para evitar erro E0600 da ACBr.

---

## 9. Regras de Lookup CNPJ/CEP

### Cadeia de Fallback
```
1. Cache em memória (Map<taxId, borrower>) — sem I/O externo
2. API CNPJ (Edge Function nf-lookup-cnpj)
   └─ Fallback interno: NF_PROD_CLIENT_ID vazio → ACBr sandbox
   └─ Fallback final: Invertexto (lookup público)
3. API CEP (Edge Function nf-lookup-cep)
   └─ Fallback interno similar
4. Banco local (municipalities ILIKE nome da cidade)
   └─ Último recurso — resolve ibgeCode por nome
5. ERRO — ibgeCode obrigatório para DPS
```

---

## 10. Erros Fiscais Conhecidos

| Código | Fonte | Condição | Solução |
|--------|-------|----------|---------|
| `E0600` | ACBr | `pAliq` presente com valor 0 | Omitir `pAliq` quando ISS rate ≤ 0 |
| `INVALID_INPUT` | Edge Function | Campo obrigatório ausente | Validar antes de chamar provedor |
| `EMISSION_ERROR` | issue-invoice | Falha genérica no provedor | Ver logs da nota |
| — | batch-import | ibgeCode não resolvido | CEP inválido ou cidade não encontrada |
| — | batch-import | Serviço não no catálogo | `codigo_servico` não corresponde a nenhum `service_item` |

---

## 11. Funções PostgreSQL de Negócio

### `auto_map_legacy_items()`
Mapeia `service_types` existentes para novos `service_items` da empresa via `cTribNac`, facilitando migração de dados legados.

### `rebuild_taxonomy_tree()`
Reconstrói a hierarquia de `tax_taxonomy_master` (NBS) — recalcula `hierarchy_level` e `is_leaf` via CTE recursiva.

### `search_taxonomy(query text)`
Busca full-text na taxonomia NBS por `code`, `nbs` ou `description`.

---

## 12. Edge Functions — Inventário Completo

| Função | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| `issue-invoice` | POST | JWT (RLS) | Emite NFS-e via IFiscalProvider |
| `batch-import-drafts` | POST | JWT (RLS) | Importa notas em lote via planilha |
| `check-invoice-status` | POST | JWT (RLS) | Consulta status da nota no provedor |
| `cancel-invoice` | POST | JWT (RLS) | Cancela nota autorizada |
| `download-invoice-files` | POST | Service Role | Baixa XML/PDF e salva URLs |
| `sync-company` | POST | JWT (RLS) | Sincroniza empresa no provedor |
| `update-fiscal-config` | POST | JWT (RLS) | Atualiza config tributária |
| `upload-certificate` | POST | JWT (RLS) | Upload de certificado A1 |
| `delete-certificate` | POST | JWT (RLS) | Remove certificado |
| `manage-logo` | POST | JWT (RLS) | Upload de logotipo |
| `nf-lookup-cnpj` | POST | Service Role | Consulta dados cadastrais CNPJ |
| `nf-lookup-cep` | POST | Service Role | Consulta endereço por CEP |
| `invite-user` | POST | JWT (OFFICE_ADMIN) | Envia convite de acesso |
| `accept-invite` | POST | Público | Aceita convite e cria conta |
| `get-platform-analytics` | GET | PLATFORM_ADMIN | Métricas da plataforma |
| `update-subscription` | POST | PLATFORM_ADMIN | Atualiza plano do escritório |
