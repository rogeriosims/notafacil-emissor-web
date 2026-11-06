# Especificação integrada: Adaptador Fiscal Hexagonal e Driver Pattern Multi-Provedor

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0004 |
| Slug | 0004-acbr-hexagonal-adapter |
| Status | Planned |
| Effort | 7 |
| Effort updated at | 2026-11-06 |
| Effort rationale | Implementação da arquitetura Ports & Adapters para emissão fiscal agnóstica via FiscalManager do Laravel, cobrindo AcbrFiscalAdapter (API v3.1.9 com certificado A1), CrawlerFiscalAdapter (microserviço Python sem A1), MockFiscalAdapter para testes e sincronismo de certificados. |
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
Amarrar o sistema emissor de NFS-e à API do ACBr cria forte acoplamento proprietário (vendor lock-in), impede o atendimento de microempreendedores (MEI) que não possuem Certificado Digital A1 e inviabiliza testes automatizados sem consumo de créditos reais de emissão ou dependência de internet.

#### Resultado desejado
Uma camada de integração fiscal 100% agnóstica baseada em Arquitetura Hexagonal (Ports & Adapters) e no Driver Pattern do Laravel (`FiscalManager`):
1. A porta canônica `FiscalProviderInterface` define as operações universais do ciclo fiscal (emissão, consulta de status, cancelamento, download de XML e DANFSE).
2. O adaptador `AcbrFiscalAdapter` traduz o DTO Canônico para a API REST da ACBr v3.1.9 utilizando Certificado A1.
3. O adaptador `CrawlerFiscalAdapter` integra com o microserviço `3 - Nota Fácil Emissor` via HTTP REST para emitir no Emissor Nacional sem certificado A1.
4. O adaptador `MockFiscalAdapter` possibilita testes de ponta a ponta em memória com latência zero.
5. A resolução do driver ocorre dinamicamente por empresa (`$company->fiscal_driver`) ou configuração global (`config('fiscal.default')`).

#### Métricas de sucesso
- Zero menções a URLs ou schemas da ACBr fora de `App\Infrastructure\Fiscal\Adapters\AcbrFiscalAdapter`.
- Suporte a troca transparente de provedor fiscal em tempo de execução via configuração.
- 100% de cobertura nos testes unitários e de integração do `FiscalManager` e `MockFiscalAdapter`.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: A API ACBr v3.1.9 requer cabeçalho `Authorization: Bearer <token>` e payload multipart para envio do certificado digital `.pfx` com senha.
- **R-002**: O microserviço crawler `3 - Nota Fácil Emissor` expõe os endpoints `POST /api/emissao` e `GET /api/emissao/{id}`, exigindo header `X-API-Key` e serialização estrita por CNPJ.
- **R-003**: Conforme definido na ADR-005, o domínio do sistema opera exclusivamente com DTOs canônicos neutros (`CanonicalInvoiceDTO`, `FiscalIssueResult`, `FiscalStatusResult`), cabendo a cada adapter fazer a tradução "De/Para".

#### Fontes e contexto consultados
- `Decisoes/ADR-005 - Arquitetura Hexagonal e Provedor Fiscal Agnostico (Multi-Driver).md`.
- `.specsfy/RULES.md` (Regra RF-05: Provedor Fiscal Agnóstico e Hexagonal).
- Documentação da API ACBr v3.1.9 e OpenAPI do `3 - Nota Fácil Emissor`.

#### Documentação consultada
- Laravel 11 Manager Pattern: `Illuminate\Support\Manager`.
- PSR-7 e HTTP Client do Laravel (`Illuminate\Support\Facades\Http`).

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: Uma empresa pode usar ACBr e outra usar Crawler simultaneamente no mesmo banco? → **A**: Sim, a resolução do driver é contextual por empresa (`$company->fiscal_driver ?? config('fiscal.default')`).
- **Q**: Como os testes automatizados evitam bater na API da ACBr? → **A**: O ambiente de testes define `FISCAL_DEFAULT_DRIVER=mock`, instanciando o `MockFiscalAdapter`.

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Interface `FiscalProviderInterface`.
- Gerenciador `FiscalManager` estendendo `Illuminate\Support\Manager`.
- Adaptadores: `AcbrFiscalAdapter`, `CrawlerFiscalAdapter` e `MockFiscalAdapter`.
- DTOs de resposta: `FiscalIssueResult`, `FiscalStatusResult`, `FiscalCancelResult`.
- Arquivo de configuração `config/fiscal.php`.
- Testes Pest de resolução de drivers e emissão mockada.

#### Fora de escopo
- Orquestração de jobs de emissão assíncrona com outbox (Spec 0005).
- Frontend de upload de certificado e seleção de driver (Spec 0007).

#### Atores
- `FiscalManager`: Fábrica e resolvedor dinâmico de drivers fiscais.
- `Job de Emissão`: Consome o provedor resolvido para transmitir notas.

### 4. Princípios e restrições do projeto
- **PR-001**: Nenhuma classe de domínio ou controller pode acoplar-se a APIs externas.
- **PR-002**: Toda resposta de provedor deve ser normalizada para enums e DTOs canônicos do sistema (`AUTHORIZED`, `PROCESSING`, `ERROR`, `CANCELED`).
- **PR-003**: O envio de certificados digitais deve respeitar a criptografia de senhas em repouso.

### 5. Histórias de usuário

#### US-001 — Resolução Dinâmica de Provedores Fiscais via FiscalManager (P1)
Como arquiteto de software, desejo que o sistema resolva drivers fiscais através de um gerenciador único, permitindo alternar entre ACBr, Crawler e Mock sem alterar código de negócio.

#### US-002 — Adaptação e Tradução para ACBr API v3.1.9 (P1)
Como empresa com certificado A1, desejo que minhas notas sejam traduzidas e transmitidas via API REST da ACBr para autorização em alta performance.

#### US-003 — Adaptação e Tradução para Crawler Nacional (P1)
Como MEI sem certificado A1, desejo que minhas notas sejam encaminhadas para o microserviço crawler para emissão no Portal Nacional.

### 6. Cenários BDD de aceite

#### AC-001 — Resolução de drivers pelo FiscalManager
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-001
Feature: Gerenciamento e Resolução de Drivers Fiscais

  Scenario: Resolução do driver padrão configurado no ambiente
    Given que a configuração "fiscal.default" é definida como "mock"
    When solicito o driver padrão ao FiscalManager
    Then o gerenciador deve retornar uma instância de MockFiscalAdapter

  Scenario: Resolução explícita de driver por empresa
    Given uma empresa configurada com "fiscal_driver" igual a "crawler"
    When solicito o driver específico para a empresa
    Then o gerenciador deve retornar uma instância de CrawlerFiscalAdapter

  Scenario: Lançamento de exceção para driver desconhecido
    Given uma solicitação de driver inexistente "provedor_invalido"
    When o FiscalManager tentar resolver o driver
    Then deve lançar InvalidArgumentException
```

#### AC-002 — Emissão via MockFiscalAdapter para testes
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-002
Feature: Driver Mock para Testes em Memória

  Scenario: Emissão bem-sucedida em memória sem rede
    Given um DTO Canônico válido de nota fiscal
    When o MockFiscalAdapter processar a emissão
    Then o resultado deve indicar status "AUTHORIZED"
    And conter trackingId "MOCK-12345" e URLs simuladas de XML e DANFSE

  Scenario: Simulação de erro controlado no driver mock
    Given que o MockFiscalAdapter está configurado para simular rejeição
    When processar a emissão de uma nota fiscal
    Then o resultado deve indicar status "ERROR" e mensagem de rejeição fiscal
```

#### AC-003 — Contrato de sincronismo de certificado digital A1
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-003
Feature: Sincronismo de Certificados A1

  Scenario: Envio de certificado A1 válido para o provedor
    Given um certificado A1 em formato base64 com senha válida
    When o adaptador fiscal invocar o método de sincronismo de certificado
    Then o certificado deve ser validado e registrado com sucesso no provedor

  Scenario: Falha de sincronismo com senha incorreta
    Given um arquivo PFX com senha divergente
    When o adaptador fiscal tentar sincronizar com o provedor
    Then deve retornar falso ou lançar exceção de autenticação do certificado
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve definir o contrato `FiscalProviderInterface` e o `FiscalManager` suportando os drivers `acbr`, `crawler` e `mock`.
- **FR-002**: O sistema deve implementar os adaptadores `AcbrFiscalAdapter`, `CrawlerFiscalAdapter` e `MockFiscalAdapter` normalizando retornos para `FiscalIssueResult`, `FiscalStatusResult` e `FiscalCancelResult`.

#### Não funcionais
- **NFR-001**: O adaptador deve utilizar timeout resiliente de HTTP (máximo 15 segundos) com retentativas controladas para falhas transitórias de conexão.
- **NFR-002**: Todas as credenciais de API (`token`, `api_key`) devem ser obtidas exclusivamente através de variáveis de ambiente via `config/fiscal.php`.

#### Erros e casos-limite
- Timeout na resposta da prefeitura ou ACBr -> status transitório `PROCESSING` com trackingId preservado.
- Resposta de rejeição cadastral da prefeitura -> normalização para `ERROR` com descrição amigável.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
A branch `main` possui o `TaxEngineService` gerando o `CanonicalInvoiceDTO` e a tabela `companies` com os campos necessários.

#### Arquitetura e módulos
- `App\Domain\Fiscal\Contracts\FiscalProviderInterface`: Porta de saída.
- `App\Domain\Fiscal\DTOs\FiscalIssueResult`: DTO de retorno de emissão.
- `App\Domain\Fiscal\DTOs\FiscalStatusResult`: DTO de retorno de polling.
- `App\Domain\Fiscal\DTOs\FiscalCancelResult`: DTO de retorno de cancelamento.
- `App\Infrastructure\Fiscal\FiscalManager`: Gerenciador de drivers.
- `App\Infrastructure\Fiscal\Adapters\AcbrFiscalAdapter`: Driver ACBr.
- `App\Infrastructure\Fiscal\Adapters\CrawlerFiscalAdapter`: Driver Crawler.
- `App\Infrastructure\Fiscal\Adapters\MockFiscalAdapter`: Driver Mock.

#### Migrations
*Nenhuma migration necessária nesta spec.*

#### Models
*Nenhum model Eloquent novo nesta spec.*

#### Controllers e casos de uso
*Não aplicável.*

#### Views e experiência
*Não aplicável.*

#### Estrutura de arquivos
- `config/fiscal.php`
- `app/Domain/Fiscal/Contracts/FiscalProviderInterface.php`
- `app/Domain/Fiscal/DTOs/FiscalIssueResult.php`
- `app/Domain/Fiscal/DTOs/FiscalStatusResult.php`
- `app/Domain/Fiscal/DTOs/FiscalCancelResult.php`
- `app/Infrastructure/Fiscal/FiscalManager.php`
- `app/Infrastructure/Fiscal/Adapters/AcbrFiscalAdapter.php`
- `app/Infrastructure/Fiscal/Adapters/CrawlerFiscalAdapter.php`
- `app/Infrastructure/Fiscal/Adapters/MockFiscalAdapter.php`
- `tests/Unit/Infrastructure/Fiscal/FiscalManagerTest.php`
- `tests/Unit/Infrastructure/Fiscal/MockFiscalAdapterTest.php`

### 9. Modelo de dados

#### Entidades
DTOs imutáveis de transferência entre adapters e serviços.

#### Estados e transições
Mapeamento de status de provedores para o `InvoiceStatus` canônico:
- ACBr `AUTORIZADA` / Crawler `CONCLUIDA` -> `InvoiceStatus::AUTHORIZED`
- ACBr `PROCESSANDO` / Crawler `PENDENTE` -> `InvoiceStatus::PROCESSING`
- ACBr `REJEITADA` / Crawler `FALHA` -> `InvoiceStatus::ERROR`

#### Migração e retenção
*Não aplicável.*

### 10. Interfaces e contratos

#### Interface para pessoas
Não há interface gráfica nesta spec.

#### Stack e convenções de interface
PHP 8.3 / Laravel HTTP Client (`Http::withToken()`).

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
Métodos da `FiscalProviderInterface`: `issue()`, `checkStatus()`, `cancel()`, `downloadXml()`, `downloadPdf()`, `syncCertificate()`.

#### APIs externas utilizadas
- ACBr API REST v3.1.9 (`/v1/nfse`).
- Microserviço Crawler FastAPI (`/api/emissao`).

#### Documentação das APIs consultadas
Swagger da ACBr API e documentação técnica do `3 - Nota Fácil Emissor`.

#### Eventos e outros contratos
*Não aplicável.*

### 11. Estratégia TDD
Ciclo estrito:
1. Escrever `FiscalManagerTest.php` validando a criação e resolução de drivers (RED).
2. Implementar `FiscalManager` e `config/fiscal.php` (GREEN).
3. Escrever `MockFiscalAdapterTest.php` testando emissão, status e cancelamento (RED -> GREEN).
4. Implementar os esqueletos de `AcbrFiscalAdapter` e `CrawlerFiscalAdapter` (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Tags `SPECSFY: AC-001`, `AC-002`, `AC-003` em todos os testes unitários.

### 12. Plano de testes e rastreabilidade
- `FiscalManagerTest.php` cobre AC-001 e FR-001.
- `MockFiscalAdapterTest.php` cobre AC-002, AC-003 e FR-002.

### 13. Validações

#### Gate do Ato I — Definição
Passou (alinhado com a ADR-005 e padrões hexagonais).

#### Gate do Ato II — Plano
Passou (contrato agnóstico e drivers desacoplados).

#### Gate do Ato III — Entrega
Pendente (testes Pest passando).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Escrever testes unitários em `tests/Unit/Infrastructure/Fiscal/FiscalManagerTest.php`.
- [ ] T002: Escrever testes unitários em `tests/Unit/Infrastructure/Fiscal/MockFiscalAdapterTest.php`.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T003: Criar arquivo de configuração `config/fiscal.php` com configurações de drivers.
- [ ] T004: Criar interface `FiscalProviderInterface` e DTOs de resultado (`FiscalIssueResult`, `FiscalStatusResult`, `FiscalCancelResult`).
- [ ] T005: Implementar classe `FiscalManager` estendendo `Illuminate\Support\Manager`.
- [ ] T006: Implementar `MockFiscalAdapter` para testes determinísticos sem rede.
- [ ] T007: Implementar `AcbrFiscalAdapter` conectando à API ACBr v3.1.9.
- [ ] T008: Implementar `CrawlerFiscalAdapter` conectando à API do microserviço FastAPI.

#### Fase 3 — Interface para Pessoas (Inertia React)
*Não aplicável para esta spec técnica.*

#### Fase 4 — Qualidade e Regressão
- [ ] T009: Executar suíte Pest e garantir 100% de sucesso nos testes de drivers fiscais.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008 -> T009.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Requer `CanonicalInvoiceDTO` (Spec 0003, já na `main`).

#### Riscos
Instabilidade em APIs de fornecedores externos. Mitigação: timeouts restritos e desacoplamento via Mock em testes.

#### Suposições
Assume-se que o endpoint do Crawler estará acessível via rede local (`http://127.0.0.1:8000`).

### 17. Decisões
- Padrão Hexagonal estrito (nenhuma regra de negócio conhece a ACBr).
- `FiscalManager` gerencia instâncias com singleton por request.

### 18. Definition of Done
- 100% dos testes Pest de `FiscalManager` e `MockFiscalAdapter` passando.
- Zero acoplamento entre os models de negócio e as classes de API externa.
