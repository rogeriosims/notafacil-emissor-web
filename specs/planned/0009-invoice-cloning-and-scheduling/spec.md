# Especificação integrada: Duplicação de Notas e Agendamentos Recorrentes

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0009 |
| Slug | 0009-invoice-cloning-and-scheduling |
| Status | Planned |
| Effort | 6 |
| Effort updated at | 2026-11-06 |
| Effort rationale | Implementação da duplicação de notas avulsas para emissão imediata (POST /api/invoices/{id}/duplicate), agendamento recorrente (mensal, trimestral, anual), substituição dinâmica de placeholders na descrição ({{mes_anterior}}, {{ano}}) e comando artisan schedules:process rodando no cron com política de até 3 retentativas. |
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
Empresas que faturam serviços recorrentes (mensalidades, contratos de consultoria, assinaturas) perdem tempo redigitando as mesmas notas todo mês e sofrem com esquecimentos e erros manuais. Além disso, quando uma nota já autorizada precisa ser emitida novamente com pequenas variações para o mesmo tomador, o operador é forçado a preencher todos os dados cadastrais do zero.

#### Resultado desejado
Uma solução completa de duplicação ágil e agendamento recorrente automatizado no Laravel 11:
1. **Ação de Duplicação Imediata:** Endpoint `POST /api/invoices/{id}/duplicate` que clona uma nota autorizada para um novo rascunho `DRAFT` na data de hoje, resetando identificadores fiscais.
2. **Agendamento Recorrente:** Gestão de regras em `invoice_schedules` com suporte a frequências (`single`, `monthly`, `quarterly`, `semiannual`, `yearly`) em dia fixo do mês.
3. **Placeholders Dinâmicos:** Resolução automática na descrição do serviço para variáveis como `{{mes}}`, `{{ano}}`, `{{mes_anterior}}` e `{{competencia_formatada}}`.
4. **Execução Automática via Worker:** Comando `php artisan schedules:process` rodando via cron do Laravel com auditoria em `schedule_execution_logs` e até 3 retentativas automáticas.

#### Métricas de sucesso
- Menos de 200ms para duplicar uma nota existente gerando novo rascunho com cálculos válidos.
- 100% dos placeholders resolvidos corretamente na data de emissão correspondente.
- Registro inviolável de log para cada nota criada por agendamento recorrente.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: O sistema legado previa a clonagem apenas vinculada à tela de agendamento na branch `feature/invoice-scheduling`. Adicionamos a funcionalidade gêmea de "Duplicar Nota" avulsa para atender a emissão sob demanda sem criação de recorrência.
- **R-002**: A resolução de placeholders deve tratar variáveis desconhecidas mantendo o texto literal e logando um aviso, evitando abortar a emissão por erro de sintaxe do operador.
- **R-003**: A duplicação de uma nota autorizada deve zerar obrigatoriamente `number`, `dps_id` e os snapshots de retorno da prefeitura (`xml_url`, `pdf_url`), recalculando o `iss_snapshot` e `federal_taxes_snapshot` para a data presente.

#### Fontes e contexto consultados
- `docs/invoice_cloning_and_scheduling_design.md` e `openspec/changes/add-invoice-scheduling/specs/invoice-cloning/spec.md`.
- `Produto/Funcionalidades-Lote-Duplicacao-Agendamento.md` (Obsidian Vault).
- `.specsfy/RULES.md` (RF-06: Duplicação e Agendamento).

#### Documentação consultada
- Laravel 11 Task Scheduling: `Schedule` e Artisan Commands.
- Carbon para manipulação avançada de datas e internacionalização de nomes de meses em português.

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: Uma nota duplicada pode alterar o tomador? → **A**: Sim, a duplicação cria um rascunho `DRAFT` totalmente editável antes da transmissão.
- **Q**: O que acontece se o agendamento cair em um dia que não existe no mês (ex: dia 31 em fevereiro)? → **A**: O agendador ajusta para o último dia válido do mês (ex: dia 28 ou 29).

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Service `InvoiceCloningService` para duplicação imediata e clonagem para agendamento.
- Service `InvoiceScheduleService` para resolução de placeholders e avanço de datas de competência.
- Comando `php artisan schedules:process`.
- Rotas de API para duplicação e CRUD de agendamentos.
- Testes Pest de duplicação, templates de placeholder e comando scheduler.

#### Fora de escopo
- Telas React de agendamento (Spec 0007).
- Transmissão direta automática para a prefeitura sem modo rascunho (Spec 0005).

#### Atores
- `Faturista`: Duplica notas existentes ou configura regras recorrentes.
- `Artisan Scheduler`: Executa periodicamente processando os agendamentos vencidos.

### 4. Princípios e restrições do projeto
- **PR-001**: Notas duplicadas nunca herdam o número da DPS ou NFS-e original.
- **PR-002**: Agendamentos só podem ser disparados uma única vez por período de competência (idempotência).
- **PR-003**: Placeholders devem produzir nomes de meses em português (pt-BR).

### 5. Histórias de usuário

#### US-001 — Duplicação Imediata de Notas Existentes (P1)
Como faturista, desejo duplicar uma nota autorizada ou com erro para gerar um novo rascunho editável com os dados pré-preenchidos.

#### US-002 — Configuração e Gestão de Agendamentos Recorrentes (P1)
Como faturista, desejo cadastrar agendamentos mensais com placeholders dinâmicos na descrição do serviço.

#### US-003 — Processamento Automático via Cron e Log de Execução (P1)
Como administrador, necessito que o cron do sistema gere as notas no dia agendado e registre o log de auditoria da execução.

### 6. Cenários BDD de aceite

#### AC-001 — Duplicação de nota para novo rascunho
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-001
Feature: Duplicação de Nota Fiscal

  Scenario: Operador duplica nota autorizada com sucesso
    Given uma nota fiscal com status "AUTHORIZED" e número "000123"
    When o operador solicitar a duplicação via "POST /api/invoices/{id}/duplicate"
    Then uma nova Invoice deve ser criada com status "DRAFT"
    And com number = null e dps_id = null
    And os dados de tomador, serviço e valores devem ser preservados
    And a data de emissão e competência devem ser atualizadas para a data atual

  Scenario: Duplicação preserva o escopo da empresa emitente
    Given uma nota de outra empresa que não pertence ao usuário
    When o usuário tentar duplicar essa nota
    Then o sistema deve recusar a operação com HTTP 403 ou 404
```

#### AC-002 — Resolução de placeholders dinâmicos na descrição
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-002
Feature: Substituição de Placeholders em Agendamentos

  Scenario: Resolução dos placeholders de mês anterior e ano corrente
    Given um agendamento com descrição "Mensalidade escolar - {{mes_anterior}} de {{ano}}"
    When o agendamento for processado no mês de Novembro de 2026
    Then a nota gerada deve conter a descrição "Mensalidade escolar - Outubro de 2026"

  Scenario: Placeholder não reconhecido é mantido literal com aviso
    Given um agendamento com descrição "Serviço {{variavel_invalida}}"
    When o agendamento for processado
    Then a nota deve conter o texto "Serviço {{variavel_invalida}}" sem travar a execução
```

#### AC-003 — Execução do comando artisan de agendamentos
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-003
Feature: Execução Automática do Scheduler

  Scenario: Comando processa agendamentos vencidos e calcula próxima data
    Given um agendamento mensal ativo com next_emission_date para hoje
    When o comando "php artisan schedules:process" for executado
    Then uma nova nota fiscal em status "DRAFT" deve ser gerada
    And o agendamento deve avançar sua next_emission_date em 1 mês
    And um registro de auditoria em "schedule_execution_logs" deve ser criado com status "SUCCESS"
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve permitir a duplicação imediata de notas autorizadas/canceladas para um novo rascunho `DRAFT` na data atual.
- **FR-002**: O sistema deve fornecer comando artisan para processar agendamentos recorrentes vencidos, resolvendo placeholders e registrando logs de execução.

#### Não funcionais
- **NFR-001**: A duplicação de nota deve executar em menos de 100ms.
- **NFR-002**: A resolução de placeholders dinâmicos deve operar em memória utilizando Carbon em português.

#### Erros e casos-limite
- Agendamento com status `PAUSED` ou `CANCELED` deve ser ignorado pelo comando cron.
- Falha no processamento de um agendamento específico não pode interromper o processamento dos demais agendamentos da fila.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
Tabelas `invoices`, `invoice_schedules` e `schedule_execution_logs` criadas na Spec 0002.

#### Arquitetura e módulos
- `App\Services\InvoiceCloningService`: Lógica de clonagem de notas e geração de rascunhos.
- `App\Services\InvoiceScheduleService`: Resolução de placeholders e cálculo de próximas datas de disparo.
- `App\Console\Commands\ProcessInvoiceSchedulesCommand`: Comando artisan executado no cron.
- `App\Http\Controllers\InvoiceCloningController`: Endpoint de duplicação.
- `App\Http\Controllers\InvoiceScheduleController`: CRUD de agendamentos.

#### Migrations
*Tabelas já criadas na Spec 0002.*

#### Models
- `Invoice`: Relação com `schedule()`.
- `InvoiceSchedule`: Métodos `advanceNextEmissionDate()`, `resolveDescription()`.
- `ScheduleExecutionLog`: Registro de auditoria.

#### Controllers e casos de uso
- `InvoiceCloningController@duplicate`: `POST /api/invoices/{id}/duplicate`.
- `InvoiceScheduleController`: Rotas REST de agendamentos.

#### Views e experiência
*Não aplicável.*

#### Estrutura de arquivos
- `app/Services/InvoiceCloningService.php`
- `app/Services/InvoiceScheduleService.php`
- `app/Console/Commands/ProcessInvoiceSchedulesCommand.php`
- `app/Http/Controllers/InvoiceCloningController.php`
- `app/Http/Controllers/InvoiceScheduleController.php`
- `tests/Feature/InvoiceCloningAndSchedulingTest.php`

### 9. Modelo de dados

#### Entidades
- `InvoiceSchedule`: `company_id`, `template_invoice_id`, `type`, `day_of_month`, `next_emission_date`, `status`, `description_template`.
- `ScheduleExecutionLog`: `schedule_id`, `invoice_id`, `status`, `details`, `execution_date`.

#### Estados e transições
- Agendamento único (`type = single`): `ACTIVE` -> `COMPLETED`.
- Agendamento recorrente (`type = monthly`): permanece `ACTIVE` e avança `next_emission_date`.

#### Migração e retenção
*Não aplicável.*

### 10. Interfaces e contratos

#### Interface para pessoas
Não há interface gráfica nesta spec.

#### Stack e convenções de interface
PHP 8.3 / Laravel Artisan / Carbon / JSON API.

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
- `POST /api/invoices/{id}/duplicate`: Duplica nota.
- `GET /api/schedules`: Lista agendamentos.
- `POST /api/schedules`: Cria agendamento.
- `PUT /api/schedules/{id}`: Atualiza agendamento.
- `DELETE /api/schedules/{id}`: Cancela agendamento.

#### Revisão visual durante o desenvolvimento
*Não aplicável.*

#### APIs expostas
Endpoints de duplicação e agendamentos.

#### APIs externas utilizadas
*Nenhuma.*

#### Documentação das APIs consultadas
*Não aplicável.*

#### Eventos e outros contratos
*Não aplicável.*

### 11. Estratégia TDD
Ciclo estrito:
1. Escrever `InvoiceCloningAndSchedulingTest.php` cobrindo duplicação, substituição de placeholders e scheduler (RED).
2. Implementar `InvoiceCloningService` e `InvoiceScheduleService` (GREEN).
3. Implementar comando `php artisan schedules:process` (GREEN).
4. Executar suíte completa do Pest (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Tags `SPECSFY: AC-001`, `AC-002`, `AC-003` em todos os testes.

### 12. Plano de testes e rastreabilidade
- `InvoiceCloningAndSchedulingTest.php` cobre AC-001, AC-002, AC-003, FR-001 e FR-002.

### 13. Validações

#### Gate do Ato I — Definição
Passou (alinhado com o design doc de agendamento e RF-06).

#### Gate do Ato II — Plano
Passou (arquitetura desacoplada via Services e Artisan Command).

#### Gate do Ato III — Entrega
Pendente (testes Pest passando).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Escrever testes Feature em `tests/Feature/InvoiceCloningAndSchedulingTest.php` cobrindo duplicação, placeholders dinâmicos e disparo do scheduler.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T002: Implementar `InvoiceCloningService` com reset de `number`, `dps_id` e atualização de competência na duplicação.
- [ ] T003: Implementar `InvoiceScheduleService` com motor de interpolação de placeholders (`{{mes}}`, `{{mes_anterior}}`, `{{ano}}`, `{{competencia_formatada}}`).
- [ ] T004: Implementar lógica de cálculo de avanço de próxima data de emissão para frequências mensal, trimestral e anual.
- [ ] T005: Implementar comando artisan `php artisan schedules:process` com auditoria em `schedule_execution_logs`.
- [ ] T006: Implementar controllers e rotas em `routes/api.php`.

#### Fase 3 — Interface para Pessoas (Inertia React)
*Não aplicável para esta spec técnica.*

#### Fase 4 — Qualidade e Regressão
- [ ] T007: Executar suíte Pest validando isolamento por tenant e persistência de rascunhos gerados.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Requer `InvoiceSchedule` e `Invoice` (Spec 0002).

#### Riscos
Disparo duplicado de notas no mesmo mês. Mitigação: trava de concorrência e verificação de competência antes da emissão.

#### Suposições
Assume-se que o scheduler do Laravel (`routes/console.php`) roda com frequência mínima diária.

### 17. Decisões
- Duplicação zera todos os identificadores de autorização fiscal.
- Placeholders utilizam nomes de meses em português (pt-BR).

### 18. Definition of Done
- 100% dos testes Pest de `InvoiceCloningAndSchedulingTest.php` passando.
- Comando `php artisan schedules:process` testado e funcional.
