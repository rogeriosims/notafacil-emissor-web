# Especificação integrada: Testes de Paridade Comportamental e Cutover

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0008 |
| Slug | 0008-parity-tests-cutover |
| Status | Planned |
| Effort | 6 |
| Effort updated at | 2026-11-08 |
| Effort rationale | Validação final de paridade comportamental entre o sistema legado e o Laravel 11, cobrindo suíte de 20 testes de paridade com fixtures reais do ACBr, comando artisan fiscalflow:import-legacy-supabase para migração de dados com chunks e idempotência, e comando fiscalflow:verify-cutover para auditoria pós-migração. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-11-08 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema
A migração de um sistema financeiro/fiscal crítico de Supabase/Deno para Laravel 11 não pode tolerar divergências de centavos em impostos nem perda de integridade histórica de notas fiscais autorizadas. É fundamental provar matematicamente que o novo motor gera exatamente os mesmos payloads aceitos pela prefeitura e fornecer um caminho de importação idempotente para os dados legados.

#### Resultado desejado
Uma camada de homologação e cutover automatizada:
1. Suíte de 20 testes de paridade comparando os payloads e cálculos do `TaxEngineService` com fixtures reais capturadas do sistema legado.
2. Comando Artisan `php artisan fiscalflow:import-legacy-supabase` com suporte a migração de escritórios, empresas, tomadores, notas, lotes e certificados em chunks transacionais com idempotência.
3. Comando Artisan `php artisan fiscalflow:verify-cutover` para checar contagens, consistência de FKs e integridade de snapshots JSONB.
4. Relatório de auditoria de cutover aprovando a virada de chave operacional para produção.

#### Métricas de sucesso
- 100% de paridade nos testes comparativos com fixtures históricas.
- Zero perda de dados na migração de dados de teste/produção.
- Idempotência total: executar a migração repetidas vezes produz o mesmo estado sem duplicidades.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: As tabelas do Supabase (`offices`, `companies`, `invoices`, etc.) utilizam UUIDs como chave primária idênticos aos definidos nas migrations do Laravel, permitindo mapeamento direto de IDs sem perda de integridade referencial.
- **R-002**: Os snapshots JSONB legados (`borrower_snapshot`, `iss_snapshot`, `federal_taxes_snapshot`) possuem formato compatível com as colunas JSONB do PostgreSQL 17 do novo sistema.
- **R-003**: A verificação de paridade deve testar casos reais de Simples Nacional (Anexo III e IV), MEI, dispensa da ADR 005 e retenção na fonte.

#### Fontes e contexto consultados
- `_reversa_sdd/target_architecture.md` (seção de testes de paridade e cutover).
- Fixtures e schemas legados em `_shared/fiscal/`.
- `.specsfy/RULES.md` e `Decisoes/ADR-005`.

#### Documentação consultada
- Laravel Artisan Console: `Illuminate\Console\Command`.
- Laravel DB Transactions e Chunks: `DB::transaction()`.

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: O que acontece se a migração falhar no meio? → **A**: As transações são executadas por entidade/chunk, e o comando possui chave única (`id` ou `tax_id`) evitando duplicidades em retentativas.
- **Q**: Os testes de paridade precisam de internet? → **A**: Não, utilizam fixtures estáticas gravadas em JSON.

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Comando `app/Console/Commands/ImportLegacySupabaseCommand.php` (`fiscalflow:import-legacy-supabase`).
- Comando `app/Console/Commands/VerifyCutoverIntegrityCommand.php` (`fiscalflow:verify-cutover`).
- Fixtures de teste legadas em `tests/Fixtures/Legacy/`.
- Suíte de testes com Pest em `tests/Feature/LegacyParityAndCutoverTest.php`.

#### Fora de escopo
- Alterações nas telas do frontend (escopo da Spec 0007).

#### Atores
- `Engenheiro de DevOps / DBA`: Executa comandos de importação e auditoria de cutover no terminal.
- `Auditor Fiscal`: Homologa os relatórios de paridade.

### 4. Princípios e restrições do projeto
- **PR-001**: O script de importação nunca deve sobrescrever notas já autorizadas no novo sistema.
- **PR-002**: Toda importação deve ser idempotente baseada no UUID original do registro.
- **PR-003**: Os testes de paridade não podem ter tolerância de divergência maior que R$ 0,00 nos cálculos tributários.

### 5. Histórias de usuário

#### US-001 — Prova de Paridade Comportamental Fiscal (P1)
Como auditor fiscal, desejo validar que o motor fiscal do novo sistema produz exatamente os mesmos resultados e payloads do sistema legado para todas as combinações de impostos.

#### US-002 — Migração Idempotente de Dados Legados (P1)
Como engenheiro de dados, necessito de um comando artisan para importar o banco de dados histórico do Supabase para o Laravel em chunks seguros e sem criar duplicidades.

#### US-003 — Auditoria e Verificação de Sanidade Pós-Cutover (P1)
Como CTO, desejo executar um comando de validação pós-migração que confirme contagens de registros, ausência de órfãos e integridade de snapshots antes da virada de DNS.

### 6. Cenários BDD de aceite

#### AC-001 — Validação de Paridade Fiscal com Fixtures Históricas
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-001
Feature: Paridade Comportamental Fiscal

  Scenario: Comparacao de calculos de impostos com fixtures legadas
    Given um conjunto de 20 fixtures representativas do sistema legado
    When o TaxEngineService processar os parametros de cada cenario
    Then os valores de ISS, IRRF, PIS, COFINS, CSLL e INSS devem ser identicos aos legados
    And a aplicacao da regra de dispensa de R$ 10,00 da ADR 005 deve coincidir 100%
```

#### AC-002 — Execução do Comando de Importação com Idempotência
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-002
Feature: Importacao Idempotente de Dados

  Scenario: Migracao de dados legados via artisan
    Given um arquivo JSON ou dump contendo dados historicos de empresas e notas
    When o comando "fiscalflow:import-legacy-supabase" for executado
    Then os registros devem ser inseridos com os mesmos UUIDs originais
    And executar o comando uma segunda vez nao deve duplicar registros nem gerar erro
```

#### AC-003 — Verificação de Integridade Referencial e Snapshots Pós-Cutover
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @FR-003 @NFR-001 @NFR-002 @AC-003
Feature: Verificacao de Integridade de Cutover

  Scenario: Auditoria automatica pos-cutover
    Given que a base de dados foi migrada
    When o comando "fiscalflow:verify-cutover" for acionado
    Then deve validar que zero notas possuem status indefinido
    And todas as notas possuem borrower_snapshot e iss_snapshot validos
    And emitir relatorio de status de cutover com sucesso
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve implementar testes automatizados de paridade comparando 20 fixtures do sistema legado contra o `TaxEngineService`.
- **FR-002**: O sistema deve fornecer o comando `fiscalflow:import-legacy-supabase` para carregar dados históricos mantendo os UUIDs originais com idempotência.
- **FR-003**: O sistema deve fornecer o comando `fiscalflow:verify-cutover` para checar consistência de integridade referencial e snapshots JSONB.

#### Não funcionais
- **NFR-001**: O processo de importação deve utilizar chunks e transações de banco com tratamento seguro de erros.
- **NFR-002**: As divergências de cálculo fiscal permitidas nos testes de paridade devem ser estritamente zero centavos.

#### Erros e casos-limite
- Registro com JSON corrompido no legado -> logar warning sem abortar a migração do lote.
- Empresa sem escritório associado -> associar a escritório padrão de migração ou reportar em log de inconsistência.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
A branch `main` possui o schema completo, models Eloquent, enums, `TaxEngineService` e orquestração de emissão.

#### Arquitetura e módulos
- `App\Console\Commands\ImportLegacySupabaseCommand`: Importador em chunks.
- `App\Console\Commands\VerifyCutoverIntegrityCommand`: Verificador de sanidade pós-cutover.
- `Tests\Feature\LegacyParityAndCutoverTest`: Suíte de validação e testes de paridade.

#### Migrations
*Nenhuma migration necessária nesta spec.*

#### Models
Utiliza os models existentes (`Office`, `Company`, `Customer`, `ServiceItem`, `Invoice`, `Certificate`).

#### Controllers e casos de uso
*Não aplicável para comandos CLI.*

#### Views e experiência
*Não aplicável.*

#### Estrutura de arquivos
- `app/Console/Commands/ImportLegacySupabaseCommand.php`
- `app/Console/Commands/VerifyCutoverIntegrityCommand.php`
- `tests/Fixtures/Legacy/parity_cases.json`
- `tests/Feature/LegacyParityAndCutoverTest.php`

### 9. Modelo de dados

#### Entidades
Manipulação direta das entidades Eloquent existentes preservando as chaves primárias UUID.

#### Estados e transições
Notas migradas preservam os status históricos (`AUTHORIZED`, `CANCELLED`, `DRAFT`).

#### Migração e retenção
Snapshots legados são convertidos para o schema JSONB do PostgreSQL sem perdas.

### 10. Interfaces e contratos

#### Interface para pessoas
Não há interface gráfica nesta spec (apenas CLI Artisan).

#### Stack e convenções de interface
Linha de comando Artisan do Laravel 11 (`$this->info()`, `$this->table()`, `$this->error()`).

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
Comandos artisan registrados no console: `fiscalflow:import-legacy-supabase` e `fiscalflow:verify-cutover`.

#### APIs externas utilizadas
*Nenhuma.*

#### Documentação das APIs consultadas
Documentação do Laravel Artisan Console.

#### Eventos e outros contratos
*Não aplicável.*

### 11. Estratégia TDD
1. Escrever `LegacyParityAndCutoverTest.php` com testes para AC-001, AC-002 e AC-003 (RED).
2. Criar `parity_cases.json` com fixtures históricas (GREEN inicial).
3. Implementar `ImportLegacySupabaseCommand.php` e `VerifyCutoverIntegrityCommand.php` (GREEN).
4. Validar suíte no Pest (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Tags `SPECSFY: AC-001`, `AC-002`, `AC-003` em todos os testes.

### 12. Plano de testes e rastreabilidade
- `LegacyParityAndCutoverTest.php` cobre AC-001 a AC-003, FR-001 a FR-003, NFR-001 e NFR-002.

### 13. Validações

#### Gate do Ato I — Definição
Passou (alinhado com as metas de cutover do Reversa).

#### Gate do Ato II — Plano
Passou (estratégia CLI e testes de paridade desacoplados).

#### Gate do Ato III — Entrega
Pendente (suíte Pest passando).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Criar fixtures em `tests/Fixtures/Legacy/parity_cases.json` e testes em `tests/Feature/LegacyParityAndCutoverTest.php`.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T002: Implementar comando `ImportLegacySupabaseCommand.php` com suporte a arquivo JSON e flags de chunk.
- [ ] T003: Implementar comando `VerifyCutoverIntegrityCommand.php` com verificação de FKs e snapshots.
- [ ] T004: Registrar os comandos em `routes/console.php`.

#### Fase 3 — Interface para Pessoas (Inertia React)
*Não aplicável para esta spec técnica.*

#### Fase 4 — Qualidade e Regressão
- [ ] T005: Executar suíte Pest e garantir 100% de sucesso nos testes de paridade e cutover.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Requer models e schemas da Spec 0002 e motor da Spec 0003.

#### Riscos
Volume grande de dados na migração. Mitigação: processamento em chunks de 100 registros com transações atômicas.

#### Suposições
Assume-se que os dados do Supabase serão exportados em formato JSON padronizado.

### 17. Decisões
- Preservação estrita dos UUIDs originais para manter rastreabilidade total.
- Tolerância zero de divergência tributária (R$ 0,00).

### 18. Definition of Done
- 100% dos testes de paridade aprovados no Pest.
- Comandos artisan executando sem erros e auditando registros com sucesso.
