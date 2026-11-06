# Especificação integrada: Modelos de Domínio e Migrations do Banco de Dados

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0002 |
| Slug | 0002-database-migrations-models |
| Status | Planned |
| Effort | 5 |
| Effort updated at | 2026-11-06 |
| Effort rationale | Modelagem relacional e migrations do ecossistema fiscal: Tomadores (customers), Itens de Serviço (service_items), Notas Fiscais (invoices) com snapshots imutáveis, Certificados Digitais A1 (certificates), Lotes (invoice_batches) e Agendamentos Recorrentes (invoice_schedules e logs). |
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
Com o scaffolding multi-tenancy e o motor tributário canônico já consolidados, o sistema necessita das entidades relacionais de negócio no PostgreSQL para persistir tomadores de serviço, catálogo de atividades/serviços municipais, certificados digitais A1 criptografados, lotes de importação assíncrona, agendamentos recorrentes e notas fiscais com histórico auditável e imutabilidade de snapshots.

#### Resultado desejado
Migrations do Laravel 11 com foreign keys, índices de performance e restrições de integridade, acompanhadas de models Eloquent associados ao `HierarchicalTenantScope` e `BelongsToTenant`, cobrindo:
1. `customers`: Cadastro de tomadores (PF/PJ/Estrangeiro) com dados de endereço e flags de retenção.
2. `service_items`: Catálogo de serviços municipais com códigos LC 116 e alíquotas.
3. `certificates`: Governança de certificados A1 com validade e criptografia.
4. `invoices`: Notas fiscais com ciclo de vida (`DRAFT`, `PROCESSING`, `AUTHORIZED`, `ERROR`, `CANCELED`) e snapshots congelados em JSONB.
5. `invoice_batches`: Controle de importação de planilhas Excel/CSV.
6. `invoice_schedules` e `schedule_execution_logs`: Regras de recorrência e trilha de execução.

#### Métricas de sucesso
- 100% das migrations executadas com sucesso no PostgreSQL e SQLite em memória.
- Relações Eloquent tipadas (`hasMany`, `belongsTo`) com `strict_types=1`.
- Snapshots JSONB protegidos contra mutação após autorização da nota.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: As notas fiscais autorizadas não podem alterar dados de tomador ou alíquotas retroativamente caso o cadastro do tomador seja editado no futuro. Por isso, a nota deve persistir snapshots JSONB imutáveis: `borrower_snapshot`, `iss_snapshot` e `federal_taxes_snapshot`.
- **R-002**: Unicidade global de CNPJ: Empresas emitentes possuem `UNIQUE (cnpj)`, mas tomadores (`customers`) pertencem ao escopo da empresa emitente (`UNIQUE (company_id, tax_id)`), permitindo que duas empresas clientes atendam o mesmo tomador sem colisão.
- **R-003**: O certificado A1 deve ter sua senha criptografada em repouso utilizando a chave mestra da aplicação (`Crypt::encryptString`).

#### Fontes e contexto consultados
- `_reversa_sdd/erd-complete.md` (Esquema de banco do legado).
- `.specsfy/RULES.md` e `.specsfy/RULES_TENANCY.md`.
- `Decisoes/ADR-005 - Arquitetura Hexagonal e Provedor Fiscal Agnostico (Multi-Driver).md`.

#### Documentação consultada
- Documentação do PostgreSQL 16: Tipos UUID, JSONB e índices GIN.
- Laravel 11 Database & Eloquent: Migrations, Casts e Foreign Key Constraints.

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: A exclusão de uma empresa apaga as notas autorizadas? → **A**: Não. Notas fiscais possuem exigência legal de guarda por 5 anos (deve-se utilizar `SoftDeletes` ou restrição `RESTRICT` de integridade referencial).
- **Q**: Uma nota pode pertencer a um lote e a um agendamento simultaneamente? → **A**: Não, são canais distintos (`batch_id` para importação massiva ou `schedule_id` para automação recorrente, ambos nullable).

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Migrations: `customers`, `service_items`, `certificates`, `invoices`, `invoice_batches`, `invoice_schedules`, `schedule_execution_logs`.
- Models Eloquent com `BelongsToTenant` e casts JSONB / Enum.
- Factories e Seeders correspondentes para testes automatizados.
- Testes Pest de integridade referencial e tenant isolation.

#### Fora de escopo
- Lógica de conexão HTTP externa com ACBr (Spec 0004).
- Processamento em background de filas de emissão (Spec 0005).
- Interface de usuário (Spec 0007).

#### Atores
- `Model Eloquent`: Camada de persistência consultada pelos Services e Controllers.
- `Database Seeder`: Inicializa dados para testes e homologação.

### 4. Princípios e restrições do projeto
- **PR-001**: Todo model com relacionamento de empresa deve usar a trait `BelongsToTenant`.
- **PR-002**: Notas autorizadas são estritamente imutáveis.
- **PR-003**: IDs primários devem ser padronizados (BigIncrements ou UUIDs conforme convenção).

### 5. Histórias de usuário

#### US-001 — Cadastro e Persistência de Tomadores e Serviços (P1)
Como operador, desejo persistir tomadores de serviço e serviços municipais com alíquotas pré-configuradas para reaproveitamento ágil na emissão.

#### US-002 — Persistência Imutável de Notas Fiscais e Snapshots (P1)
Como auditor fiscal, necessito que toda nota emitida armazene o snapshot exato dos dados cadastrais e tributários da data de autorização.

#### US-003 — Estruturas de Lote, Agendamento e Certificado A1 (P1)
Como faturista, necessito de tabelas dedicadas para controle de importação em lote de planilhas e regras de disparo de agendamentos recorrentes.

### 6. Cenários BDD de aceite

#### AC-001 — Tomador e serviço vinculados ao tenant
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-001
Feature: Gestão de Tomadores e Catálogo de Serviços

  Scenario: Tomador cadastrado com sucesso sob o tenant da empresa
    Given uma empresa cliente autenticada
    When cadastro um tomador com CNPJ "12.345.678/0001-90" e flag de retenção de ISS ativa
    Then o tomador deve ser persistido associado ao "company_id" da empresa ativa
    And outras empresas de escritórios distintos não visualizam esse tomador

  Scenario: Catálogo de serviço municipal cadastrado
    Given uma empresa prestadora de serviços
    When cadastro um serviço municipal com código LC 116 "01.07" e alíquota de 3,5%
    Then o item deve ser salvo com sucesso com a alíquota validada
```

#### AC-002 — Persistência e imutabilidade de notas com snapshots
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-002
Feature: Notas Fiscais e Snapshots JSONB

  Scenario: Criação de nota fiscal em rascunho com cálculos congelados
    Given um tomador e um serviço válidos
    When crio uma nota fiscal no status "DRAFT"
    Then a nota deve persistir "borrower_snapshot" e "iss_snapshot" em formato JSONB
    And o valor líquido deve corresponder ao cálculo do TaxEngineService

  Scenario: Bloqueio de exclusão direta de nota autorizada
    Given uma nota fiscal com status "AUTHORIZED"
    When tento invocar o comando de exclusão física no banco de dados
    Then o sistema deve bloquear a operação garantindo a integridade dos livros fiscais
```

#### AC-003 — Estruturas de lote, agendamento e logs
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-003
Feature: Lotes, Agendamentos e Governança

  Scenario: Criação de agendamento recorrente mensal
    Given uma nota fiscal modelo
    When crio um agendamento do tipo "monthly" para o dia 10 de cada mês
    Then o registro em "invoice_schedules" deve ser salvo com status "active"
    And associar a nota original como "template_invoice_id"

  Scenario: Criação de lote de importação com contadores
    Given o upload de uma planilha de 50 notas
    When o lote for criado na tabela "invoice_batches"
    Then o contador "total_records" deve ser inicializado com 50 e status "PENDING"
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve fornecer migrations e models para Tomadores (`customers`), Serviços (`service_items`), Certificados (`certificates`) e Notas Fiscais (`invoices`).
- **FR-002**: O sistema deve fornecer migrations e models para Lotes de importação (`invoice_batches`), Agendamentos (`invoice_schedules`) e Logs de execução (`schedule_execution_logs`).

#### Não funcionais
- **NFR-001**: Todos os models devem utilizar `BelongsToTenant` para herdar o escopo de segurança por empresa.
- **NFR-002**: As colunas de snapshot (`borrower_snapshot`, `iss_snapshot`, `federal_taxes_snapshot`) devem utilizar o tipo `jsonb` no Postgres com casts automáticos de array/objeto no Eloquent.

#### Erros e casos-limite
- Tentativa de cadastrar tomador duplicado com mesmo CNPJ/CPF para a mesma empresa.
- Falha de integridade ao tentar remover serviço associado a notas fiscais existentes.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
Branches `main` consolidada com os models `Office`, `Company`, `User`, scopes multi-tenant e o `TaxEngineService`.

#### Arquitetura e módulos
- `App\Models\Customer`: Tomadores de serviço.
- `App\Models\ServiceItem`: Catálogo de serviços municipais.
- `App\Models\Certificate`: Dados criptografados do certificado A1.
- `App\Models\Invoice`: Nota fiscal com status e snapshots.
- `App\Models\InvoiceBatch`: Lotes de importação.
- `App\Models\InvoiceSchedule`: Agendamentos de emissão recorrente.
- `App\Models\ScheduleExecutionLog`: Logs de auditoria do cron.

#### Migrations
- `2026_11_06_000001_create_customers_table.php`
- `2026_11_06_000002_create_service_items_table.php`
- `2026_11_06_000003_create_certificates_table.php`
- `2026_11_06_000004_create_invoice_batches_table.php`
- `2026_11_06_000005_create_invoice_schedules_table.php`
- `2026_11_06_000006_create_invoices_table.php`
- `2026_11_06_000007_create_schedule_execution_logs_table.php`

#### Models
- `Customer`: Relações `company()`, `invoices()`.
- `ServiceItem`: Relações `company()`, `invoices()`.
- `Certificate`: Relação `company()`.
- `Invoice`: Relações `company()`, `customer()`, `batch()`, `schedule()`.
- `InvoiceBatch`: Relações `company()`, `invoices()`.
- `InvoiceSchedule`: Relações `company()`, `templateInvoice()`, `executionLogs()`.
- `ScheduleExecutionLog`: Relação `schedule()`.

#### Controllers e casos de uso
*Não aplicável — spec de modelagem de dados.*

#### Views e experiência
*Não aplicável.*

#### Estrutura de arquivos
- `app/Models/Customer.php`
- `app/Models/ServiceItem.php`
- `app/Models/Certificate.php`
- `app/Models/Invoice.php`
- `app/Models/InvoiceBatch.php`
- `app/Models/InvoiceSchedule.php`
- `app/Models/ScheduleExecutionLog.php`
- `database/factories/*`
- `tests/Feature/DomainModelIntegrityTest.php`

### 9. Modelo de dados

#### Entidades
- `Customer`: id, company_id, name, tax_id, email, phone, street, number, neighborhood, city_code, state, zip_code, iss_withheld, timestamps.
- `ServiceItem`: id, company_id, service_code, cnae_code, description, default_rate, allow_retention, timestamps.
- `Certificate`: id, company_id, pfx_encrypted, password_encrypted, expires_at, issuer_info, timestamps.
- `Invoice`: id, company_id, issuing_office_id, customer_id, batch_id, schedule_id, status, number, series, dps_id, issue_date, competence_date, service_amount, deductions_amount, net_amount, borrower_snapshot, iss_snapshot, federal_taxes_snapshot, xml_url, pdf_url, timestamps.
- `InvoiceBatch`: id, company_id, total_records, processed_records, error_records, status, errors, timestamps.
- `InvoiceSchedule`: id, company_id, template_invoice_id, type, day_of_month, next_emission_date, status, description_template, timestamps.
- `ScheduleExecutionLog`: id, schedule_id, invoice_id, status, details, execution_date.

#### Estados e transições
- Invoice Status: `DRAFT` -> `PROCESSING` -> `AUTHORIZED` (ou `ERROR` / `CANCELED`).
- Batch Status: `PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED`.
- Schedule Status: `ACTIVE` -> `PAUSED` -> `COMPLETED` / `CANCELED`.

#### Migração e retenção
Índices em `company_id`, `(company_id, tax_id)`, `(company_id, status)` e `(next_emission_date, status)`.

### 10. Interfaces e contratos

#### Interface para pessoas
Não há interface gráfica nesta spec.

#### Stack e convenções de interface
PHP 8.3 / Eloquent ORM com tipos estritos.

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
*Não aplicável.*

#### APIs externas utilizadas
*Nenhuma.*

#### Documentação das APIs consultadas
*Não aplicável.*

#### Eventos e outros contratos
*Não aplicável.*

### 11. Estratégia TDD
Ciclo estrito:
1. Escrever testes de relacionamentos e escopo em `tests/Feature/DomainModelIntegrityTest.php` (RED).
2. Criar migrations e models Eloquent (GREEN).
3. Validar casts de JSONB e imutabilidade de snapshots (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Tags `SPECSFY: AC-001`, `AC-002`, `AC-003` mapeadas nos testes Feature do Pest.

### 12. Plano de testes e rastreabilidade
- `DomainModelIntegrityTest.php` cobre AC-001, AC-002, AC-003, FR-001 e FR-002.

### 13. Validações

#### Gate do Ato I — Definição
Passou (esquema alinhado com o legado e com o SNNFSe).

#### Gate do Ato II — Plano
Passou (relacionamentos e chaves estrangeiras modelados).

#### Gate do Ato III — Entrega
Pendente (migrations rodando e testes passando).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Escrever testes Pest em `tests/Feature/DomainModelIntegrityTest.php` cobrindo relacionamentos de `Customer`, `ServiceItem`, `Invoice`, `Batch` e `Schedule`.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T002: Criar migration e model `Customer` com escopo de tenant e factory.
- [ ] T003: Criar migration e model `ServiceItem` com validações de código e alíquota.
- [ ] T004: Criar migration e model `Certificate` com cast para dados criptografados.
- [ ] T005: Criar migration e model `InvoiceBatch` com contadores de processamento.
- [ ] T006: Criar migrations e models `InvoiceSchedule` e `ScheduleExecutionLog`.
- [ ] T007: Criar migration e model `Invoice` com snapshots JSONB, status enum e relacionamentos.

#### Fase 3 — Interface para Pessoas (Inertia React)
*Não aplicável para esta spec técnica de banco de dados.*

#### Fase 4 — Qualidade e Regressão
- [ ] T008: Executar suíte completa do Pest e validar constraints no SQLite e PostgreSQL.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Requer migrations de `offices` e `companies` (Spec 0001, já na `main`).

#### Riscos
Conflito de nomes de constraints no PostgreSQL. Mitigação: usar nomes padrão do Laravel ou explícitos.

#### Suposições
Assume-se que o banco de dados suporta JSONB nativo (PostgreSQL) com fallback compatível para JSON (SQLite em testes).

### 17. Decisões
- Unicidade de tomador é composta por `(company_id, tax_id)`.
- Snapshots de notas utilizam `jsonb` nativo.

### 18. Definition of Done
- 100% das migrations executadas sem erro.
- Testes Pest em `DomainModelIntegrityTest.php` passando.
- Relações Eloquent completamente tipadas.
