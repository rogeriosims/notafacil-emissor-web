# Auditoria de Falhas de Lógica e Riscos de Transação (FiscalFlow)

> Documento gerado pelo **Inquisitor** (Reversa Audit) em 2026-11-05.  
> Base de análise: `_reversa_sdd/code-analysis.md`, `_reversa_sdd/domain.md`, `docs/DATABASE_SCHEMA.md` e código fonte em `supabase/functions/` e `src/services/`.

---

## 🚨 Sumário Executivo

A auditoria identificou **10 falhas críticas e médias** na arquitetura atual. 
A transição para **Laravel** é uma oportunidade única para eliminar essas vulnerabilidades por meio de **transações atômicas de banco (ACID)**, **Queues/Workers com retry idempotente** e encapsulamento em **Domain Services puros**.

---

## 📋 Matriz de Falhas Identificadas

| ID | Severidade | Categoria | Descrição Sucinta |
|:---|:---:|:---|:---|
| **LOGIC-001** | 🔴 Crítica | Fiscal / Legal | **Omissão total de Retenções Federais (INSS, IRRF, CSRF)** no motor de cálculo e DPS |
| **LOGIC-002** | 🔴 Crítica | Transacional | **Risco de orfandade de nota autorizada** em falhas de rede pós-chamada da ACBr |
| **LOGIC-003** | 🔴 Crítica | Concorrência | **Race condition na numeração de DPS/RPS** em emissões concorrentes ou em lote |
| **LOGIC-004** | 🟠 Alta | Validação | **Ausência de Hard Guard contra alíquota de ISS > 5%** (Rejeição E1300 do ADN) |
| **LOGIC-005** | 🟠 Alta | Fiscal | **Descumprimento do local de incidência do ISS** (`iss_due_at_execution` ignorado) |
| **LOGIC-006** | 🟠 Alta | Arquitetura | **Duplicação e drift de regras fiscais** entre Frontend (`taxEngine.ts`) e Backend (`issue-invoice`) |
| **LOGIC-007** | 🟡 Média | Governança | **Falta de controle de idempotência na criação de notas** (`POST /invoices`) |
| **LOGIC-008** | 🟡 Média | Transacional | **Ausência de rollback transacional em batches** (`batch-import-drafts`) |
| **LOGIC-009** | 🟡 Média | Segurança / Multi-tenant | **Dependência exclusiva de RLS** sem validação defensiva em camadas de serviço |
| **LOGIC-010** | 🟢 Baixa | Resiliência | **Polling ineficiente de status** via Edge Functions sem backoff exponencial configurável |

---

## 🔍 Detalhamento das Falhas & Recomendações para Laravel

### LOGIC-001: Omissão Total de Retenções Federais (INSS, IRRF, CSRF)
- **Componente:** `src/services/issuance/taxEngine.ts`, `supabase/functions/_shared/fiscal/mappers/invoiceMapper.ts`
- **Vulnerabilidade:** O motor fiscal atual calcula exclusivamente o ISS. Os campos de retenções federais (`vRetIRRF`, `vRetCP` [INSS], `vRetCSLL`, `vRetPIS`, `vRetCOFINS`) não são calculados nem enviados no payload da DPS.
- **Evidência:** `taxEngine.ts` só possui propriedades para ISS e `netAmount = isRetained ? baseCalculation - issValue : baseCalculation`. A ADR 005 já define o piso de R$ 10,00 por fato gerador sem acumulação mensal, mas essa decisão nunca foi codificada na `main`.
- **Impacto:** Notas emitidas com tomadores que exigem retenção federal saem sem destaque legal, expondo prestadores e tomadores a autuações da Receita Federal e divergências no cruzamento EFD-Reinf / DCTFWeb.
- **Mitigação no Laravel:**
  - Criar um **Domain Service** `FederalTaxCalculator` que calcule INSS (11%), IRRF (1,5%) e CSRF (4,65% unificado).
  - Aplicar a regra estrita da **ADR 005**: se o valor apurado por imposto/bloco for $\le$ R$ 10,00, zerar o destaque.
  - Abater as retenções federais da base para formar o `net_amount` real da fatura.

---

### LOGIC-002: Orfandade de Nota Autorizada em Falha Pós-Gateway
- **Componente:** `supabase/functions/issue-invoice/index.ts`
- **Vulnerabilidade:** A Edge Function faz a chamada HTTP para a ACBr API. Se a resposta da ACBr for recebida com sucesso (nota autorizada), mas a conexão do Supabase falhar logo em seguida ao atualizar a tabela `invoices`, a nota continuará como `ERROR` ou `DRAFT` no banco local, mesmo já existindo perante a Prefeitura.
- **Evidência:** O código executa chamadas I/O externas assíncronas no meio do handler HTTP Deno, sem gerenciamento de outbox ou compensação transacional de duas fases.
- **Impacto:** O usuário tenta reemitir a nota, gerando duplicidade tributária ou rejeição de duplicidade de DPS pela Prefeitura.
- **Mitigação no Laravel:**
  - Implementar o padrão **Transactional Outbox / Job Queues**:
    1. Salvar intenção de emissão com status `PROCESSING`.
    2. Disparar um Job assíncrono `ProcessInvoiceIssuanceJob`.
    3. Em caso de timeout de rede com a ACBr, o job executa uma consulta de status antes de retentar o envio (`Idempotent Retry`).

---

### LOGIC-003: Race Condition na Numeração Sequencial de DPS
- **Componente:** `supabase/functions/_shared/fiscal/providers/acbr/acbrProvider.ts` / Tabela `companies.rps`
- **Vulnerabilidade:** A sequência numérica da DPS/RPS é obtida a partir do JSONB `rps` na tabela `companies`. Em requisições de emissão disparadas simultaneamente por usuários diferentes da mesma empresa ou em importações paralelas, dois processos podem ler o mesmo `rps.numero` antes do incremento ser persistido.
- **Evidência:** O incremento é feito na aplicação e gravado por um `UPDATE` simples sem lock pessimista (`SELECT FOR UPDATE`).
- **Impacto:** O ADN rejeita a segunda DPS com o erro **E0004** ou **DPS duplicada**.
- **Mitigação no Laravel:**
  - Criar uma tabela dedicada `invoice_sequences` ou utilizar `DB::transaction()` com lock pessimista:
    ```php
    $company = Company::where('id', $companyId)->lockForUpdate()->first();
    $nextNumber = $company->incrementNextRpsNumber();
    ```

---

### LOGIC-004: Ausência de Hard Guard contra Alíquota de ISS > 5%
- **Componente:** `src/services/issuance/taxEngine.ts`
- **Vulnerabilidade:** O campo `issRate` aceita qualquer valor digitado pelo usuário. A Constituição Federal e a LC 116/2003 fixam o teto do ISS em 5,00%. Se o usuário digitar "6%" ou confundir com impostos federais, a nota é submetida e rejeitada pelo ADN com o erro **E1300**.
- **Impacto:** UX degradada e emissões bloqueadas com mensagens de erro crípticas da prefeitura.
- **Mitigação no Laravel:**
  - Criar um **FormRequest** e **ValueObject** `IssRate`:
    ```php
    if ($rate > 5.00 && !$isSpecialRegime) {
        throw new InvalidTaxRateException('A alíquota de ISS não pode ultrapassar 5,00%.');
    }
    ```

---

### LOGIC-005: Descumprimento do Local de Incidência do ISS (Exceção LC 116/2003)
- **Componente:** `src/services/retentionLogic.ts`
- **Vulnerabilidade:** A regra do art. 3º da LC 116/2003 estabelece que certos serviços (ex: construção civil, limpeza, vigilância) têm o ISS devido no **local da prestação** (município do tomador/obra), e não no domicílio do prestador. A tabela `service_types` possui a coluna `iss_due_at_execution`, mas o motor ignora esse atributo.
- **Evidência:** O `retentionLogic.ts` possui comentários informando que a verificação de IBGE entre prestador e tomador é um placeholder.
- **Impacto:** O ISS pode ser recolhido para o município incorreto, gerando bitributação ou autuação do município onde a obra foi executada.
- **Mitigação no Laravel:**
  - Encapsular a regra territorial em `TaxJurisdictionResolver`:
    - Se `service.iss_due_at_execution === true`, a alíquota e o destino do ISS são forçados para o IBGE do tomador/local da prestação.

---

### LOGIC-006: Duplicação e Drift de Regras Fiscais entre Frontend e Backend
- **Componente:** Frontend React (`taxEngine.ts`) vs Supabase Functions (`issue-invoice/index.ts`)
- **Vulnerabilidade:** A matemática e a decisão de retenção foram codificadas duas vezes (uma no TypeScript do client e outra no backend Deno). Qualquer alteração em um precisa ser replicada manualmente no outro.
- **Impacto:** Se o client calcular um valor e a Edge Function recalcular com pequenas diferenças de arredondamento, o usuário vê um valor no formulário que diverge da nota emitida.
- **Mitigação no Laravel:**
  - Adotar **Inertia.js** ou uma **Single Source of Truth na API**: O backend Laravel é o único detentor do motor de cálculo. O frontend apenas chama um endpoint `POST /api/invoices/simulate-taxes` para obter o cálculo oficial em tempo real.

---

### LOGIC-007: Falta de Idempotency Key nas Operações de Emissão
- **Componente:** `supabase/functions/issue-invoice/index.ts`
- **Vulnerabilidade:** O endpoint de emissão não exige cabeçalho `Idempotency-Key`. Se o usuário der duplo clique no botão "Emitir Nota" ou a rede oscilar e o browser retentar, duas instâncias do processo são disparadas.
- **Mitigação no Laravel:**
  - Middleware global de idempotência usando Redis (`idempotency_key` no header), garantindo que requisições repetidas retornem a resposta em cache da primeira sem reexecutar o fluxo fiscal.

---

### LOGIC-008: Falha Parcial e Transações Ausentes em Lotes (`batch-import-drafts`)
- **Componente:** `supabase/functions/batch-import-drafts/index.ts`
- **Vulnerabilidade:** Se um lote de 100 rascunhos falhar no 80º registro, os 79 anteriores permanecem no banco sem agrupamento formal de lote atômico ou sem possibilidade de rollback limpo.
- **Mitigação no Laravel:**
  - Implementar **Laravel Jobs em Chunks com Batches**:
    ```php
    Bus::batch($invoiceJobs)->then(function (Batch $batch) {
        // Notificar sucesso total
    })->catch(function (Batch $batch, Throwable $e) {
        // Tratar falha parcial com relatório de erros
    })->dispatch();
    ```

---

### LOGIC-009: Fragilidade na Dependência Exclusiva de RLS para Multi-Tenancy
- **Componente:** Banco de dados PostgreSQL
- **Vulnerabilidade:** O isolamento multi-tenant depende 100% de políticas RLS no Postgres. Se uma query de backend for executada com `service_role` (que faz bypass de RLS), o tenant fica desprotegido se o `office_id` não for explicitamente filtrado na cláusula `WHERE`.
- **Mitigação no Laravel:**
  - Aplicar **Global Scope no Eloquent** para todos os modelos com tenant:
    ```php
    class TenantScope implements Scope {
        public function apply(Builder $builder, Model $model) {
            $builder->where('office_id', session('current_office_id'));
        }
    }
    ```
  - Isso garante proteção em dobro: no código da aplicação e nas permissões do banco.

---

### LOGIC-010: Polling Ineficiente de Status sem Backoff
- **Componente:** `supabase/functions/check-invoice-status/index.ts`
- **Vulnerabilidade:** As notas em processamento são consultadas repetidamente em intervalos fixos, gerando tráfego desnecessário e risco de bloqueio por rate-limit da ACBr API.
- **Mitigação no Laravel:**
  - Utilizar **Webhooks** da ACBr (se suportado) ou filas de verificação com **delay exponencial**:
    ```php
    CheckInvoiceStatusJob::dispatch($invoice)->delay(now()->addSeconds(30));
    ```

---

## 🎯 Conclusão da Auditoria

Esses 10 itens foram catalogados no padrão Reversa e servem como **requisitos obrigatórios** para a arquitetura alvo Laravel. Nenhum desses problemas precisa ser corrigido no código legado TypeScript se a decisão for portar o sistema diretamente para Laravel.
