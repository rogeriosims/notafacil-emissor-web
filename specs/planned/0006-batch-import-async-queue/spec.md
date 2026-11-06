# Especificação integrada: Importação em Lote Assíncrona e Fila de Rascunhos

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0006 |
| Slug | 0006-batch-import-async-queue |
| Status | Planned |
| Effort | 6 |
| Effort updated at | 2026-11-06 |
| Effort rationale | Upload e parsing de planilhas Excel (.xlsx) e CSV (limite 300 linhas), normalização de cabeçalhos waterfall, resolução automática de tomador/serviço, processamento assíncrono via Laravel Bus::batch() e Redis Queues, e trava de segurança contra exclusão de lotes com notas autorizadas. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-11-06 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema
No sistema legado, a importação em lote dependia de uma Edge Function no Deno com timeout estrito de 60 segundos, causando falhas catastróficas em arquivos com mais de 100 linhas (falha LOGIC-008). Além disso, a exclusão de lotes não validava se notas já haviam sido autorizadas na prefeitura, permitindo perda acidental de vínculo contábil.

#### Resultado desejado
Uma arquitetura de importação em lote altamente escalável e assíncrona no Laravel 11 utilizando `Bus::batch()` e Redis Queues:
1. Suporte a uploads de arquivos `.xlsx` e `.csv` com limite estrito de 300 linhas por lote.
2. Normalização waterfall de cabeçalhos e resolução automática de Tomadores não cadastrados.
3. Processamento em jobs atômicos com contadores de progresso em tempo real (`total_records`, `processed_records`, `error_records`).
4. Aplicação do `TaxEngineService` canônico em cada linha para geração de notas em status `DRAFT`.
5. Trava de segurança intransponível impedindo a exclusão de lotes que possuam notas com status `AUTHORIZED` ou `PROCESSING`.

#### Métricas de sucesso
- Zero timeouts em planilhas de 300 linhas (processamento 100% desacoplado do ciclo HTTP).
- 100% dos erros por linha registrados com detalhe em JSONB (`errors`) para consulta do operador.
- Zero exclusões acidentais de notas autorizadas vinculadas a lotes.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: O processamento síncrono ou monolítico em Edge Functions falha por timeout; o Laravel `Bus::batch()` distribui o parse em jobs atômicos por linha (`ProcessBatchRowJob`) permitindo retry seletivo de falhas e callbacks `then()`, `catch()`, `finally()`.
- **R-002**: A resolução de tomador deve buscar primeiramente por `tax_id` no escopo da empresa. Se não encontrar, cadastra o tomador em modo básico com os dados da planilha.
- **R-003**: A proteção de exclusão exige que `DELETE /api/batches/{id}` verifique a existência de notas em status restrito antes de expurgar rascunhos.

#### Fontes e contexto consultados
- `_reversa_sdd/batches/requirements.md` e `_reversa_sdd/batches/design.md`.
- `Produto/Funcionalidades-Lote-Duplicacao-Agendamento.md` (Obsidian Vault).
- `.specsfy/RULES.md` (RF-06: Emissão em Lote).

#### Documentação consultada
- Laravel 11 Job Batching: `Illuminate\Support\Facades\Bus`.
- Spatie Simple Excel / PHPSpreadsheet para parsing de `.xlsx` e `.csv`.

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: O que acontece se 5 linhas de 100 falharem? → **A**: As 95 linhas válidas criam notas `DRAFT` normalmente; o lote vai para `COMPLETED` com `error_records = 5` e os detalhes ficam gravados em `errors`.
- **Q**: Pode deletar um lote com notas DRAFT? → **A**: Sim. Deletar um lote com notas em rascunho limpa o lote e purga os rascunhos em cascata.

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Service `BatchImportService` para upload, validação e despacho de jobs.
- Job `ProcessBatchRowJob` para cálculo e criação individual de nota `DRAFT`.
- Endpoints de API: `POST /api/batches`, `GET /api/batches`, `GET /api/batches/{id}`, `DELETE /api/batches/{id}`.
- Exceção `BatchDeletionBlockedException` para bloqueio de segurança.
- Testes Pest de lote e regras de segurança.

#### Fora de escopo
- Transmissão dos rascunhos para a prefeitura (Spec 0005).
- Interface React de upload (Spec 0007).

#### Atores
- `Operador/Faturista`: Faz upload de planilha e consulta progresso do lote.
- `Queue Worker (Redis)`: Consome e processa as linhas em background.

### 4. Princípios e restrições do projeto
- **PR-001**: O upload nunca deve bloquear a requisição HTTP; o controller apenas salva o arquivo e despacha o lote.
- **PR-002**: O limite de 300 linhas é inegociável para garantir previsibilidade e evitar sobrecarga de memória.
- **PR-003**: Cálculos tributários das notas do lote devem passar obrigatoriamente pelo `TaxEngineService`.

### 5. Histórias de usuário

#### US-001 — Upload e Despacho Assíncrono de Planilhas em Lote (P1)
Como faturista, desejo enviar planilhas Excel/CSV com até 300 linhas e receber confirmação imediata de processamento em segundo plano.

#### US-002 — Resolução Automática de Entidades e Cálculo Fiscal (P1)
Como faturista, desejo que o sistema resolva automaticamente tomadores e calcule os tributos de cada linha criando notas em rascunho.

#### US-003 — Proteção de Integridade e Exclusão Segura de Lotes (P1)
Como auditor, necessito que lotes com notas já autorizadas sejam bloqueados contra exclusão para garantir a rastreabilidade contábil.

### 6. Cenários BDD de aceite

#### AC-001 — Despacho e processamento em lote via Bus::batch
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-001
Feature: Importação em Lote Assíncrona

  Scenario: Upload de planilha com 50 linhas cria lote e despacha jobs
    Given uma empresa autenticada e uma planilha válida de 50 linhas
    When submeto o upload para "POST /api/batches"
    Then o sistema deve criar um registro em "invoice_batches" com total_records = 50
    And responder HTTP 202 com o ID do lote
    And despachar 50 jobs no Redis Queues via Bus::batch

  Scenario: Rejeição de planilha que excede o teto de 300 linhas
    Given uma planilha contendo 350 linhas
    When tentar realizar o upload do lote
    Then o sistema deve rejeitar com HTTP 422 e mensagem "O limite máximo por lote é de 300 linhas"

  Scenario: Progresso do lote atualizado em tempo real
    Given um lote em processamento
    When cada job de linha for concluído com sucesso
    Then o contador "processed_records" do lote deve ser incrementado atomicamente
```

#### AC-002 — Criação de rascunhos e resolução de tomador
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-002
Feature: Criação de Notas Rascunho pelo Lote

  Scenario: Tomador inexistente na planilha é cadastrado automaticamente
    Given uma linha de planilha com CNPJ de tomador novo "99.888.777/0001-66"
    When o job da linha for processado
    Then um novo Customer deve ser criado sob o tenant da empresa
    And uma Invoice com status "DRAFT" deve ser gerada vinculada ao lote

  Scenario: Linha com alíquota inválida é registrada no log de erros do lote
    Given uma linha de planilha com alíquota de ISS de 8,00%
    When o job da linha for processado
    Then a nota não deve ser criada
    And o contador "error_records" deve ser incrementado
    And o detalhe do erro deve constar na coluna "errors" do lote
```

#### AC-003 — Trava de segurança na exclusão de lotes
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-003
Feature: Trava de Segurança de Exclusão de Lote

  Scenario: Exclusão bloqueada para lote contendo notas autorizadas
    Given um lote que possui pelo menos uma nota com status "AUTHORIZED"
    When o usuário tentar excluir o lote via "DELETE /api/batches/{id}"
    Then o sistema deve barrar com HTTP 403 e lançar BatchDeletionBlockedException
    And nenhuma nota do lote deve ser apagada

  Scenario: Exclusão permitida para lote contendo apenas rascunhos
    Given um lote contendo apenas notas em status "DRAFT" ou "ERROR"
    When o usuário excluir o lote
    Then o lote e todas as notas associadas devem ser excluídos com sucesso
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve fornecer endpoint de upload de arquivos `.xlsx` e `.csv`, limitados a 300 linhas, despachando jobs de linha via `Bus::batch()`.
- **FR-002**: O sistema deve criar notas em status `DRAFT` calculadas pelo `TaxEngineService`, resolver tomadores automaticamente e impedir a exclusão de lotes com notas autorizadas.

#### Não funcionais
- **NFR-001**: A resposta inicial do upload deve ocorrer em menos de 1 segundo (tempo de validação de cabeçalho e contagem de linhas).
- **NFR-002**: Incrementos nos contadores do lote (`processed_records`, `error_records`) devem ser atômicos no PostgreSQL para suportar múltiplos workers em paralelo.

#### Erros e casos-limite
- Arquivo corrompido ou formato não suportado -> HTTP 422.
- Planilha vazia (zero linhas de dados) -> HTTP 422.
- Queda de worker durante o lote -> retry automático de até 3 vezes por job.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
Tabela `invoice_batches` e `invoices` criadas na Spec 0002. `TaxEngineService` criado na Spec 0003.

#### Arquitetura e módulos
- `App\Services\BatchImportService`: Parse de planilha, validação de limites e despacho do batch.
- `App\Jobs\ProcessBatchRowJob`: Processamento individual de cada linha.
- `App\Http\Controllers\BatchController`: Endpoints REST para batches.
- `App\Exceptions\BatchDeletionBlockedException`: Bloqueio de segurança.

#### Migrations
*Tabela invoice_batches já criada na Spec 0002.*

#### Models
- `InvoiceBatch`: Usado para persistir estado, contadores e erros.
- `Invoice`: Criado em status `DRAFT` associado ao `batch_id`.

#### Controllers e casos de uso
- `BatchController@store`: Recebe arquivo multipart, valida e despacha.
- `BatchController@show`: Retorna status, contadores e erros.
- `BatchController@destroy`: Valida trava de notas autorizadas e exclui.

#### Views e experiência
*Não aplicável — spec de backend e filas.*

#### Estrutura de arquivos
- `app/Services/BatchImportService.php`
- `app/Jobs/ProcessBatchRowJob.php`
- `app/Http/Controllers/BatchController.php`
- `app/Exceptions/BatchDeletionBlockedException.php`
- `tests/Feature/BatchImportQueueTest.php`

### 9. Modelo de dados

#### Entidades
- `InvoiceBatch`: `company_id`, `total_records`, `processed_records`, `error_records`, `status`, `errors` (JSONB).

#### Estados e transições
- `InvoiceBatch`: `PENDING` -> `PROCESSING` -> `COMPLETED` (ou `FAILED`).

#### Migração e retenção
*Não aplicável.*

### 10. Interfaces e contratos

#### Interface para pessoas
Não há interface gráfica nesta spec.

#### Stack e convenções de interface
PHP 8.3 / Laravel Queues / JSON REST API.

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
- `POST /api/batches`: Upload de arquivo (`multipart/form-data`).
- `GET /api/batches`: Lista lotes da empresa.
- `GET /api/batches/{id}`: Detalhes e progresso do lote.
- `DELETE /api/batches/{id}`: Exclusão com proteção.

#### Revisão visual durante o desenvolvimento
*Não aplicável.*

#### APIs expostas
Endpoints do `BatchController`.

#### APIs externas utilizadas
*Nenhuma.*

#### Documentação das APIs consultadas
*Não aplicável.*

#### Eventos e outros contratos
Callbacks do `Bus::batch`: `then()`, `catch()`, `finally()`.

### 11. Estratégia TDD
Ciclo estrito:
1. Escrever `BatchImportQueueTest.php` testando upload, criação de rascunhos e trava de exclusão (RED).
2. Implementar `BatchImportService` e `ProcessBatchRowJob` (GREEN).
3. Implementar `BatchController` e travas de segurança (GREEN).
4. Executar suíte completa do Pest (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Tags `SPECSFY: AC-001`, `AC-002`, `AC-003` em todos os testes.

### 12. Plano de testes e rastreabilidade
- `BatchImportQueueTest.php` cobre AC-001, AC-002, AC-003, FR-001 e FR-002.

### 13. Validações

#### Gate do Ato I — Definição
Passou (regras consolidadas na RF-06 e superando a limitação de 60s do Deno).

#### Gate do Ato II — Plano
Passou (arquitetura resiliente baseada em Redis Queues).

#### Gate do Ato III — Entrega
Pendente (testes Pest passando).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Escrever testes Feature em `tests/Feature/BatchImportQueueTest.php` cobrindo upload, parse, resolução de tomador e trava de exclusão.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T002: Implementar exceção `BatchDeletionBlockedException`.
- [ ] T003: Implementar `BatchImportService` com validação de limite de 300 linhas e normalização de colunas.
- [ ] T004: Implementar job `ProcessBatchRowJob` com resolução de Customer e chamada ao `TaxEngineService`.
- [ ] T005: Implementar `BatchController` com rotas `store`, `show`, `index` e `destroy` (com proteção de notas autorizadas).
- [ ] T006: Registrar rotas em `routes/api.php`.

#### Fase 3 — Interface para Pessoas (Inertia React)
*Não aplicável para esta spec técnica.*

#### Fase 4 — Qualidade e Regressão
- [ ] T007: Executar suíte Pest e validar processamento em lote em memória e com filas simuladas.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Requer `InvoiceBatch` e `Invoice` (Spec 0002) e `TaxEngineService` (Spec 0003).

#### Riscos
Consumo excessivo de memória ao ler planilhas grandes. Mitigação: leitura em streams com limite de 300 linhas.

#### Suposições
Assume-se Redis disponível como driver de filas para suporte nativo a `Bus::batch()`.

### 17. Decisões
- Lotes com qualquer nota autorizada não podem ser excluídos.
- Limite estrito de 300 linhas por arquivo.

### 18. Definition of Done
- 100% dos testes Pest de `BatchImportQueueTest.php` passando.
- Trava de exclusão de lote validada contra violações.
