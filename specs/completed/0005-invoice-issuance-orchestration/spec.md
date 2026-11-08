# Especificação integrada: Orquestração Transacional de Emissão de NFS-e

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0005 |
| Slug | 0005-invoice-issuance-orchestration |
| Status | Planned |
| Effort | 7 |
| Effort updated at | 2026-11-07 |
| Effort rationale | Implementação do fluxo de emissão assíncrono e transacional de NFS-e no Laravel 11, cobrindo IssueInvoiceJob com snapshots imutáveis, CheckInvoiceStatusJob com backoff exponencial, Idempotency-Key, reconciliação pré-retry contra orfandade pós-gateway (LOGIC-002), endpoints REST de emissão, cancelamento e auditoria em invoice_payloads. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-11-07 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema
No sistema legado, a emissão síncrona dentro de Edge Functions gerava falhas críticas de confiabilidade fiscal:
1. **Falha LOGIC-002 (Orfandade pós-gateway):** Se a conexão com o provedor (ACBr/Prefeitura) sofresse timeout após o gateway já ter recebido a DPS, a nota ficava presa em limbo; re-tentar a emissão criava notas duplicadas ou rejeições por duplicidade na prefeitura.
2. **Falha LOGIC-007 (Falta de Idempotência):** Duplos cliques do operador ou retransmissões de rede disparavam múltiplas requisições de emissão para a mesma nota fiscal.
3. **Falha LOGIC-010 (Polling Ineficiente):** O polling de status era feito por loops síncronos agressivos ou recaía sobre o frontend, sobrecarregando a infraestrutura.

#### Resultado desejado
Uma arquitetura de orquestração assíncrona, transacional e idempotente no Laravel 11:
1. Transição atômica de status: a nota transita de `DRAFT` para `PROCESSING` antes da chamada externa, garantindo bloqueio contra edições concorrentes.
2. Reconciliação pré-retry (LOGIC-002): se uma nota estiver em `PROCESSING` e sofrer retry, o sistema consulta primeiro a prefeitura (`checkStatus`) pelo `tracking_id` para verificar se a DPS já foi processada antes de submeter nova autorização.
3. Suporte a cabeçalho `Idempotency-Key` e lock atômico no banco/cache durante a emissão.
4. Registro de auditoria completa de payloads (`invoice_payloads`) para cada requisição e resposta do provedor fiscal.
5. Polling assíncrono em fila (`CheckInvoiceStatusJob`) com backoff exponencial progressivo (15s, 30s, 60s, 120s) até a autorização ou rejeição final.
6. Cancelamento seguro com validação de status `AUTHORIZED` e justificativa obrigatória com mínimo de 15 caracteres.

#### Métricas de sucesso
- Zero notas fiscais em estado órfão pós-timeout de gateway.
- 100% de prevenção contra emissão duplicada via chave de idempotência e locks transacionais.
- 100% dos payloads enviados e recebidos auditados na tabela `invoice_payloads`.
- Suíte completa de testes Pest cobrindo emissão síncrona, assíncrona, polling, cancelamento e reconciliação.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: O padrão Outbox/Job do Laravel permite isolar a transação do banco da chamada HTTP de rede. Primeiro persistimos o status `PROCESSING` e despachamos o `IssueInvoiceJob`.
- **R-002**: A resolução de provedor deve consumir exclusivamente o `FiscalManager::driver($company->fiscal_driver)`, desacoplando a camada de jobs do provedor real (ACBr/Crawler/Mock).
- **R-003**: A tabela `invoice_payloads` deve armazenar `invoice_id`, `request_payload` (jsonb), `response_payload` (jsonb), `http_status` e `endpoint` para compliance fiscal estrito.

#### Fontes e contexto consultados
- `_reversa_sdd/invoices/requirements.md` e `_reversa_sdd/invoices/design.md`.
- `Decisoes/ADR-005 - Arquitetura Hexagonal e Provedor Fiscal Agnostico.md`.
- `.specsfy/RULES.md` (RF-05 e limites de integridade fiscal).

#### Documentação consultada
- Laravel 11 Queues e Rate Limiting (`Illuminate\Queue\Middleware\WithoutOverlapping`).
- Laravel Cache Lock (`Cache::lock`).

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: O que acontece se o provedor responder imediatamente com `AUTHORIZED`? → **A**: A nota atualiza direto para `AUTHORIZED`, grava número da nota, XML/PDF e encerra o fluxo sem necessidade de polling.
- **Q**: O que acontece se o provedor responder `PROCESSING` (lote assíncrono)? → **A**: A nota salva o `tracking_id` e agenda o `CheckInvoiceStatusJob` na fila com delay inicial.
- **Q**: Uma nota cancelada pode ser reemitida? → **A**: Não, notas canceladas são terminais. Para nova emissão, clona-se a nota para novo rascunho.

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Migration para criar a tabela `invoice_payloads` e colunas auxiliares na tabela `invoices` (`tracking_id`, `cancellation_reason`, `cancelled_at`).
- Model `InvoicePayload` com relacionamento `Invoice hasMany InvoicePayload`.
- Job `IssueInvoiceJob` (orquestração de envio, montagem de `CanonicalInvoiceDTO` a partir dos snapshots, transição de estados e auditoria).
- Job `CheckInvoiceStatusJob` (polling assíncrono com backoff exponencial e limite de tentativas).
- Controller `InvoiceIssuanceController` com rotas:
  - `POST /api/invoices/{id}/issue`
  - `POST /api/invoices/{id}/cancel`
  - `GET /api/invoices/{id}/status`
- Testes de Feature e Unit com Pest cobrindo todos os cenários de emissão, retry, polling e cancelamento.

#### Fora de escopo
- Telas React de acompanhamento de transmissão (Spec 0007).
- Portes adicionais de relatórios e homologação de paridade (Spec 0008).

#### Atores
- `Operador/Faturista`: Solicita emissão e cancelamento de notas fiscais.
- `Queue Worker`: Executa `IssueInvoiceJob` e `CheckInvoiceStatusJob` assincronamente.
- `Fiscal Gateway`: Provedor fiscal configurado na empresa (Mock em testes, ACBr/Crawler em produção).

### 4. Princípios e restrições do projeto
- **PR-001**: Nenhuma nota fiscal pode ser submetida ao provedor sem que seu status já tenha sido gravado atomicamente como `PROCESSING`.
- **PR-002**: Toda requisição e resposta do gateway deve ser registrada na íntegra na tabela `invoice_payloads`.
- **PR-003**: Cancelamento de nota exige status `AUTHORIZED` e justificativa com no mínimo 15 caracteres.
- **PR-004**: O provedor fiscal consumido deve ser unicamente a abstração `FiscalManager::driver()`.

### 5. Histórias de usuário

#### US-001 — Emissão Transacional e Prevenção de Orfandade (P1)
Como faturista, desejo submeter notas fiscais em rascunho para emissão de forma transacional, garantindo que timeouts de rede não deixem a nota em estado indefinido nem permitam emissões duplicadas.

#### US-002 — Reconciliação Automática e Idempotência de Envio (P1)
Como sistema faturador, necessito reconciliar notas em processamento consultando a prefeitura antes de re-tentar o envio e bloquear requisições duplicadas via chave de idempotência.

#### US-003 — Polling Assíncrono com Backoff e Cancelamento de Notas (P1)
Como faturista, necessito que notas com processamento assíncrono na prefeitura sejam consultadas automaticamente em fila e que notas autorizadas possam ser canceladas com justificativa formal.

### 6. Cenários BDD de aceite

#### AC-001 — Emissão síncrona com autorização imediata e congelamento de snapshots
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-001
Feature: Emissao Transacional de NFS-e

  Scenario: Emissao sincrona com autorizacao imediata
    Given que existe uma nota fiscal no status "DRAFT" pertencente a empresa ativa
    When o operador envia uma requisicao POST "/api/invoices/{id}/issue"
    Then o status da nota transita atomicamente para "PROCESSING"
    And o IssueInvoiceJob dispara a emissao via FiscalManager driver
    And recebendo status "AUTHORIZED" com numero, XML e PDF
    Then a nota atualiza para "AUTHORIZED" e registra o evento em invoice_payloads
```

#### AC-002 — Reconciliação pré-retry de nota em processamento após timeout de rede (LOGIC-002)
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-002
Feature: Reconciliacao Pre-Retry contra Orfandade

  Scenario: Reconciliacao de nota presa em processamento
    Given que uma nota fiscal ja se encontra no status "PROCESSING" com tracking_id gravado
    When o operador ou job de retry tenta emitir novamente a mesma nota fiscal
    Then o sistema consulta a prefeitura chamando FiscalManager checkStatus com o tracking_id
    And se a prefeitura informar que a nota ja foi autorizada
    Then a nota e imediatamente finalizada como "AUTHORIZED" sem submeter nova DPS duplicada
```

#### AC-003 — Polling assíncrono em fila com backoff progressivo para lotes em processamento
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-003
Feature: Polling Assincrono de Status com Backoff

  Scenario: Polling progressivo para retorno assincrono da prefeitura
    Given que uma nota fiscal e submetida e o provedor retorna status "PROCESSING" com tracking_id
    When o IssueInvoiceJob detecta a resposta assincrona
    Then a nota persiste o tracking_id mantendo o status "PROCESSING"
    And despacha o job CheckInvoiceStatusJob na fila com delay inicial de 15 segundos
    And a cada execucao sem conclusao, reagenda com backoff exponencial ate autorizar ou rejeitar
```

#### AC-004 — Cancelamento de nota fiscal autorizada com justificativa obrigatória
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-004
Feature: Cancelamento Seguro de Nota Fiscal

  Scenario: Cancelamento bem-sucedido de nota autorizada
    Given que uma nota fiscal possui status "AUTHORIZED"
    When o operador requisita POST "/api/invoices/{id}/cancel" com justificativa valida de 15 caracteres
    Then o sistema aciona FiscalManager cancel com tracking_id e motivo
    And atualiza a nota para "CANCELLED", registra cancelled_at e audita o payload

  Scenario: Rejeicao de cancelamento com justificativa curta
    Given que uma nota fiscal possui status "AUTHORIZED"
    When o operador tenta cancelar com justificativa menor que 15 caracteres
    Then a requisicao deve ser rejeitada com codigo HTTP 422
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve fornecer o `IssueInvoiceJob` para orquestrar a montagem de `CanonicalInvoiceDTO`, validação de pré-requisitos, transição atômica e chamada ao `FiscalManager`.
- **FR-002**: O sistema deve implementar reconciliação pré-retry e chave de idempotência para evitar orfandade e emissão duplicada (LOGIC-002 e LOGIC-007).
- **FR-003**: O sistema deve fornecer o `CheckInvoiceStatusJob` para consulta periódica de notas assíncronas com backoff progressivo e endpoint de cancelamento com justificativa mínima de 15 caracteres.

#### Não funcionais
- **NFR-001**: Toda transação de envio deve persistir o status `PROCESSING` antes da chamada HTTP externa para garantir rastreabilidade completa e tolerância a falhas.
- **NFR-002**: Toda requisição de emissão concorrente para a mesma nota fiscal deve ser bloqueada via lock atômico ou verificação transacional.

#### Erros e casos-limite
- Timeout de conexão com gateway -> manter status `PROCESSING` e despachar `CheckInvoiceStatusJob`.
- Rejeição formal da prefeitura -> atualizar status para `ERROR` e persistir mensagem de erro amigável.
- Tentativa de cancelar nota já cancelada ou em rascunho -> retornar HTTP 422.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
A branch `main` possui a tabela `invoices`, o `FiscalManager` com os adaptadores (`AcbrFiscalAdapter`, `CrawlerFiscalAdapter`, `MockFiscalAdapter`), o `TaxEngineService` e a infraestrutura de filas configurada.

#### Arquitetura e módulos
- `App\Jobs\IssueInvoiceJob`: Orquestra validação, envio ao gateway e transições de estado.
- `App\Jobs\CheckInvoiceStatusJob`: Polling assíncrono com backoff progressivo.
- `App\Http\Controllers\InvoiceIssuanceController`: Endpoints REST para emissão, consulta de status e cancelamento.
- `App\Models\InvoicePayload`: Entidade de log e conformidade fiscal.

#### Migrations
- `database/migrations/2026_11_07_000001_add_tracking_and_cancellation_to_invoices.php`: Adiciona `tracking_id`, `cancellation_reason`, `cancelled_at` à tabela `invoices`.
- `database/migrations/2026_11_07_000002_create_invoice_payloads_table.php`: Cria tabela `invoice_payloads` (`id`, `invoice_id`, `request_payload`, `response_payload`, `http_status`, `endpoint`, `timestamps`).

#### Models
- `App\Models\InvoicePayload`: Pertence a `Invoice` (`invoice_id`).

#### Controllers e casos de uso
- `App\Http\Controllers\InvoiceIssuanceController`:
  - `issue(Request $request, Invoice $invoice)`
  - `status(Invoice $invoice)`
  - `cancel(Request $request, Invoice $invoice)`

#### Views e experiência
*Não aplicável para esta spec técnica de backend.*

#### Estrutura de arquivos
- `database/migrations/2026_11_07_000001_add_tracking_and_cancellation_to_invoices.php`
- `database/migrations/2026_11_07_000002_create_invoice_payloads_table.php`
- `app/Models/InvoicePayload.php`
- `app/Jobs/IssueInvoiceJob.php`
- `app/Jobs/CheckInvoiceStatusJob.php`
- `app/Http/Controllers/InvoiceIssuanceController.php`
- `tests/Feature/InvoiceIssuanceOrchestrationTest.php`

### 9. Modelo de dados

#### Entidades
- `Invoice`: Atualizado com `tracking_id` (string nullable), `cancellation_reason` (text nullable), `cancelled_at` (timestamp nullable).
- `InvoicePayload`: `id` (uuid), `invoice_id` (uuid fk), `request_payload` (jsonb), `response_payload` (jsonb), `http_status` (int), `endpoint` (string), `timestamps`.

#### Estados e transições
- `DRAFT` -> `PROCESSING` -> `AUTHORIZED` (sucesso imediato ou após polling).
- `DRAFT` -> `PROCESSING` -> `ERROR` (rejeição).
- `AUTHORIZED` -> `CANCELLED` (cancelamento formal).

#### Migração e retenção
Snapshots e payloads são mantidos indefinidamente para compliance fiscal.

### 10. Interfaces e contratos

#### Interface para pessoas
Não há interface gráfica nesta spec.

#### Stack e convenções de interface
Endpoints REST com envelopes JSON estruturados.

#### Telas e responsabilidades
*Não aplicável.*

#### Fluxo de informação e navegação
*Não aplicável.*

#### Menus e navegação principal
*Não aplicável.*

#### Formulários e ações
*Não aplicável.*

#### Composição e disposição
*Não aplicável.*

#### Blocos React e componentes selecionados
*Não aplicável.*

#### Estados e acessibilidade
*Não aplicável.*

#### Contrato CRUD
*Não aplicável.*

#### Revisão visual durante o desenvolvimento
*Não aplicável.*

#### APIs expostas
- `POST /api/invoices/{id}/issue`: Dispara emissão.
- `GET /api/invoices/{id}/status`: Consulta status atual da nota.
- `POST /api/invoices/{id}/cancel`: Cancela nota autorizada com payload `{"cancellation_reason": "Motivo com mais de 15 caracteres"}`.

#### APIs externas utilizadas
`FiscalManager::driver($company->fiscal_driver)->issue()`, `checkStatus()`, `cancel()`.

#### Documentação das APIs consultadas
Contrato da `FiscalProviderInterface` estabelecido na Spec 0004.

#### Eventos e outros contratos
*Não aplicável.*

### 11. Estratégia TDD
Ciclo estrito:
1. Escrever `InvoiceIssuanceOrchestrationTest.php` com os testes para AC-001 a AC-004 (RED).
2. Criar migrations e model `InvoicePayload` (GREEN inicial).
3. Implementar `IssueInvoiceJob` e `CheckInvoiceStatusJob` (GREEN).
4. Implementar `InvoiceIssuanceController` e registrar rotas em `routes/api.php` (GREEN completo).
5. Refatorar e assegurar 100% de cobertura (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Tags `SPECSFY: AC-001`, `AC-002`, `AC-003`, `AC-004` em todos os métodos de teste.

### 12. Plano de testes e rastreabilidade
- `tests/Feature/InvoiceIssuanceOrchestrationTest.php` cobre AC-001 a AC-004, FR-001 a FR-003, NFR-001 e NFR-002.

### 13. Validações

#### Gate do Ato I — Definição
Passou (alinhado com a ADR-005 e eliminação da falha LOGIC-002).

#### Gate do Ato II — Plano
Passou (jobs desacoplados e outbox pattern estruturado).

#### Gate do Ato III — Entrega
Pendente (execução e aprovação no Pest).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Escrever testes automatizados com Pest em `tests/Feature/InvoiceIssuanceOrchestrationTest.php`.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T002: Criar migration para adicionar `tracking_id`, `cancellation_reason` e `cancelled_at` à tabela `invoices`.
- [ ] T003: Criar migration e model `InvoicePayload`.
- [ ] T004: Implementar `IssueInvoiceJob` com transição atômica `PROCESSING`, despacho para `FiscalManager`, reconciliação pré-retry (LOGIC-002) e registro de payload.
- [ ] T005: Implementar `CheckInvoiceStatusJob` com backoff exponencial e atualização de status final.
- [ ] T006: Implementar `InvoiceIssuanceController` com endpoints `issue`, `status` e `cancel`.
- [ ] T007: Registrar as novas rotas em `routes/api.php` protegidas pelo middleware `EnsureTenantContext`.

#### Fase 3 — Interface para Pessoas (Inertia React)
*Não aplicável para esta spec técnica.*

#### Fase 4 — Qualidade e Regressão
- [ ] T008: Executar suíte Pest e garantir 100% de sucesso nos testes de orquestração de emissão.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Requer `FiscalManager` e `MockFiscalAdapter` (Spec 0004) e models base (Spec 0002).

#### Riscos
Concorrência de emissão simultânea. Mitigação: transição de status atômica no banco antes de invocar o gateway.

#### Suposições
Assume-se que o driver padrão no ambiente de testes é `mock`.

### 17. Decisões
- Reconciliação pré-retry obrigatória para notas em `PROCESSING` antes de submeter nova DPS (eliminação da falha LOGIC-002).
- Armazenamento em JSONB de todos os payloads brutos trocados com o gateway fiscal.

### 18. Definition of Done
- 100% dos testes em `tests/Feature/InvoiceIssuanceOrchestrationTest.php` aprovados no Pest.
- Migrations executadas sem advertências no PostgreSQL.
