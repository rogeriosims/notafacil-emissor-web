# Especificação integrada: Motor Tributário Canônico de ISS e Tributos Federais (ADR 005)

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0003 |
| Slug | 0003-tax-engine-iss-federal |
| Status | Planned |
| Effort | 8 |
| Effort updated at | 2026-11-05 |
| Effort rationale | Implementação do motor matemático fiscal centralizado (Single Source of Truth), cascata de retenção de ISS em 5 níveis, retenções federais (INSS, IRRF, CSRF) com aplicação estrita da ADR 005 e matriz de 512 testes combinatórios no Pest. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Pending |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-11-05 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema
O sistema anterior sofria com fragmentação do cálculo tributário entre Edge Functions e frontend React, causando inconsistências em alíquotas de ISS, falhas de retenção de INSS em empresas do Simples Nacional (Anexo IV) e violação de conformidade tributária por tentar acumular pagamentos mensais para aplicar o piso de R$ 10,00 de retenção na fonte.

#### Resultado desejado
Um motor tributário canônico em PHP 8.3/Laravel 11, desacoplado de banco de dados e de provedores de API, atuando como a Fonte Única da Verdade Fiscal (Single Source of Truth) para calcular ISS (2% a 5%), cascata de retenção em 5 níveis e tributos federais com aplicação estrita da ADR 005 (dispensa <= R$ 10,00 por fato gerador sem acumulação mensal).

#### Métricas de sucesso
- 100% dos cálculos tributários centralizados no backend.
- Zero desvios de arredondamento em relação à tabela oficial (arredondamento bancário em centavos `ROUND_HALF_UP`).
- 512 cenários combinatórios aprovados na suíte de testes unitários do Pest.

### 2. Research e esclarecimentos

#### Researchs executados
- **R-001**: O piso de R$ 10,00 de retenção na fonte para IRRF e CSRF deve ser avaliado exclusivamente por documento fiscal no momento da emissão, sendo proibido ao emissor acumular faturamentos retroativos no mês civil.
- **R-002**: Empresas do Simples Nacional no Anexo IV sofrem retenção de INSS na fonte (11% ou 3,5% com CPRB) quando houver cessão de mão de obra.
- **R-003**: A CSRF (4,65%) deve ter PIS (0,65%), COFINS (3,00%) e CSLL (1,00%) segregados para o Padrão Nacional.

#### Fontes e contexto consultados
- `.specsfy/RULES_FISCAL_CANONICAL.md` e `.specsfy/RULES.md`.
- `Decisoes/ADR-003 - Motor Fiscal Centralizado JsonLogic e ADR 005.md`.

#### Documentação consultada
- Solução de Consulta COSIT nº 258/2024 e Lei Complementar nº 116/2003.

#### Artefatos de pesquisa armazenados
- Nenhum artefato externo.

#### Dúvidas respondidas
- **Q**: MEI sofre retenção? → **A**: Não, isenção total.
- **Q**: PF retém federais? → **A**: Não, PF não é substituto de federais.
- **Q**: Se CSRF for exatamente R$ 10,00? → **A**: Dispensada (<= 10.00).

#### Dúvidas abertas
- Nenhuma dúvida aberta.

### 3. Escopo e atores

#### Incluído
- Motor de cálculo `TaxEngineService` puro em memória.
- DTOs canônicos neutros.
- Cascata de retenção de ISS em 5 níveis.
- Retenções de INSS, IRRF e CSRF com regra de dispensa <= R$ 10,00 da ADR 005.
- Matriz combinatória de 512 cenários de teste automatizados em Pest.

#### Fora de escopo
- Persistência em banco de dados (coberto na Spec 0002/0005).
- Interface de usuário (coberto na Spec 0007).
- Transmissão externa via API/ACBr (coberto na Spec 0004).

#### Atores
- `Emissor/Operador`: Fornece os dados do serviço e obtém o cálculo exato.
- `Fila de Emissão`: Processa lotes consumindo o cálculo em microssegundos.

### 4. Princípios e restrições do projeto
- Domínio puro: O cálculo não pode fazer queries SQL nem depender do Eloquent.
- Imutabilidade: DTOs devem ser readonly.
- Precisão: Toda operação financeira deve utilizar floats formatados ou `bcmath` com 2 casas decimais.

### 5. Histórias de usuário

#### US-001 — Cálculo de ISS e Cascata de Retenção em 5 Níveis (P1)
Como emissor de NFS-e, desejo que o sistema calcule a base de cálculo e determine se há retenção de ISS seguindo os 5 níveis legais de precedência.

#### US-002 — Retenções Federais com Aplicação Estrita da ADR 005 (P1)
Como analista fiscal, desejo que o sistema calcule INSS, IRRF e CSRF aplicando a dispensa de R$ 10,00 por fato gerador sem acumulação mensal retroativa.

#### US-003 — Matriz Combinatória de 512 Cenários (P1)
Como engenheiro de software, desejo que o motor fiscal seja submetido a 512 permutações automáticas para blindagem total contra regressões.

### 6. Cenários BDD de aceite

#### AC-001 — Cascata de retenção de ISS
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-001
Feature: Cascata de Retenção de ISS em 5 Níveis

  Scenario: Serviço veda retenção na fonte (Nível 1 de prioridade)
    Given que o serviço possui configuração de impedimento com "allow_retention" falso
    When o tomador for órgão público substituto tributário
    Then o ISS não deve ser retido pelo tomador

  Scenario: Prestador optante pelo MEI nunca sofre retenção (Nível 2)
    Given que o prestador de serviços é optante pelo regime MEI
    When emitir nota fiscal de qualquer serviço para qualquer tomador
    Then o ISS não deve ser retido

  Scenario: Tomador substituto tributário força retenção (Nível 3)
    Given que o prestador é Lucro Presumido e o serviço permite retenção
    And o tomador possui a flag "iss_withheld" verdadeira
    When o motor fiscal calcular a retenção
    Then o ISS deve ser marcado como retido na fonte
```

#### AC-002 — Retenções federais e aplicação estrita da ADR 005
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-002
Feature: Retenções Federais e Piso de Dispensa da ADR 005

  Scenario: Dispensa legal de IRRF menor ou igual a R$ 10,00 por fato gerador
    Given uma nota fiscal com valor de serviço de R$ 600,00 sujeita a IRRF de 1,5%
    When o motor fiscal calcular o valor de IRRF de R$ 9,00
    Then a retenção de IRRF deve ser dispensada com valor 0,00 sem acumulação mensal

  Scenario: Retenção de CSRF acima de R$ 10,00 com segregação de componentes
    Given uma nota fiscal com valor de serviço de R$ 1.000,00 sujeita a CSRF de 4,65%
    When o motor fiscal calcular o valor total de CSRF de R$ 46,50
    Then o valor total de CSRF deve ser retido na fonte
    And segregado em PIS de R$ 6,50, COFINS de R$ 30,00 e CSLL de R$ 10,00

  Scenario: Simples Nacional no Anexo IV com cessão de mão de obra retém INSS
    Given um prestador optante pelo Simples Nacional prestando serviço do Anexo IV
    And com contrato de cessão de mão de obra ativa
    When o motor fiscal avaliar as retenções federais
    Then deve reter 11% de INSS na fonte e manter IRRF e CSRF zerados
```

#### AC-003 — Validação de alíquotas e limites legais da LC 116
**Cobre**: US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @US-003 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-003
Feature: Validação de Alíquotas e Limites Legais

  Scenario: Alíquota de ISS abaixo do piso constitucional de 2%
    Given uma alíquota nominal de ISS informada de 1,50%
    When o motor fiscal validar os parâmetros tributários
    Then deve rejeitar a operação lançando InvalidTaxRateException

  Scenario: Alíquota de ISS acima do teto constitucional de 5%
    Given uma alíquota nominal de ISS informada de 5,50%
    When o motor fiscal validar os parâmetros tributários
    Then deve rejeitar a operação lançando InvalidTaxRateException

  Scenario: Alíquota de ISS regular dentro da faixa legal
    Given uma alíquota nominal de ISS informada de 3,00%
    When o motor fiscal validar os parâmetros tributários
    Then a validação deve passar com sucesso e prosseguir com o cálculo
```

### 7. Requisitos

#### Funcionais
- **FR-001**: O sistema deve validar alíquotas de ISS no intervalo legal de 2,00% a 5,00% e executar a cascata de retenção de ISS em 5 níveis determinísticos.
- **FR-002**: O sistema deve calcular retenções federais (INSS, IRRF, CSRF) aplicando a dispensa de R$ 10,00 por fato gerador sem acumulação mensal (ADR 005) e segregando a CSRF em PIS, COFINS e CSLL.

#### Não funcionais
- **NFR-001**: O cálculo em memória deve executar em menos de 1 milissegundo por documento sem dependência de queries SQL.
- **NFR-002**: Cálculos financeiros devem utilizar precisão de 2 casas decimais e arredondamento padrão PHP_ROUND_HALF_UP.

#### Erros e casos-limite
- Alíquotas negativas ou nulas sem justificativa legal.
- Notas com valor líquido negativo após deduções e retenções.
- Descontos incondicionados superiores ao valor do serviço.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente
A aplicação possui agora o scaffolding base do Laravel 11. O namespace `App\Domain\Fiscal` abrigará os serviços puros de domínio.

#### Arquitetura e módulos
- `App\Domain\Fiscal\DTOs`: Objetos de transferência de dados canônicos.
- `App\Domain\Fiscal\Services`: `TaxEngineService` implementando a lógica canônica.
- `App\Domain\Fiscal\Exceptions`: Exceções de domínio fiscais.

#### Migrations
*Nenhuma migration nesta spec (lógica pura de domínio em memória).*

#### Models
*Nenhum model Eloquent nesta spec.*

#### Controllers e casos de uso
*Não aplicável — camada de domínio pura.*

#### Views e experiência
*Não aplicável.*

#### Estrutura de arquivos
- `app/Domain/Fiscal/DTOs/CanonicalInvoiceDTO.php`
- `app/Domain/Fiscal/DTOs/TaxCalculationResult.php`
- `app/Domain/Fiscal/DTOs/RetentionDetailDTO.php`
- `app/Domain/Fiscal/DTOs/CsrfDetailDTO.php`
- `app/Domain/Fiscal/Services/TaxEngineService.php`
- `app/Domain/Fiscal/Exceptions/InvalidTaxRateException.php`
- `tests/Unit/Domain/Fiscal/IssRetentionCascadeTest.php`
- `tests/Unit/Domain/Fiscal/FederalRetentionAdr005Test.php`
- `tests/Unit/Domain/Fiscal/CombinatorialTaxMatrixTest.php`

### 9. Modelo de dados

#### Entidades
DTOs imutáveis em memória (`CanonicalInvoiceDTO`, `TaxCalculationResult`).

#### Estados e transições
*Não aplicável (cálculo funcional determinístico).*

#### Migração e retenção
*Não aplicável.*

### 10. Interfaces e contratos

#### Interface para pessoas
Não há interface gráfica direta nesta spec.

#### Stack e convenções de interface
PHP 8.3 / Types estritos (`declare(strict_types=1);`).

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
`TaxEngineService::calculate(CanonicalInvoiceDTO $dto): TaxCalculationResult`

#### APIs externas utilizadas
*Nenhuma (cálculo interno autônomo).*

#### Documentação das APIs consultadas
*Não aplicável.*

#### Eventos e outros contratos
*Não aplicável.*

### 11. Estratégia TDD
Ciclo estrito:
1. Escrever `tests/Unit/Domain/Fiscal/IssRetentionCascadeTest.php` (RED).
2. Implementar `TaxEngineService` (GREEN).
3. Escrever `tests/Unit/Domain/Fiscal/FederalRetentionAdr005Test.php` (RED -> GREEN).
4. Rodar a matriz de 512 cenários em `CombinatorialTaxMatrixTest.php` (REFACTOR).

#### Evidência RED-GREEN-REFACTOR
Toda asserção conterá tags `SPECSFY: AC-001`, `AC-002`, `AC-003`.

### 12. Plano de testes e rastreabilidade
- `IssRetentionCascadeTest.php` cobre AC-001 e FR-001.
- `FederalRetentionAdr005Test.php` cobre AC-002 e FR-002.
- `CombinatorialTaxMatrixTest.php` cobre AC-003, NFR-001 e NFR-002.

### 13. Validações

#### Gate do Ato I — Definição
Passou (regras validadas pelas normas fiscais e ADR 005).

#### Gate do Ato II — Plano
Passou (arquitetura desacoplada em DTOs).

#### Gate do Ato III — Entrega
Pendente (suíte de testes Pest passando).

### 14. Tarefas

#### Fase 1 — RED TDD informado pelo BDD
- [ ] T001: Criar DTOs canônicos e exceção `InvalidTaxRateException` em `app/Domain/Fiscal/`.
- [ ] T002: Escrever testes RED da cascata de 5 níveis de ISS em `tests/Unit/Domain/Fiscal/IssRetentionCascadeTest.php`.
- [ ] T003: Escrever testes RED dos tributos federais e ADR 005 em `tests/Unit/Domain/Fiscal/FederalRetentionAdr005Test.php`.

#### Fase 2 — US-001 a US-003 Implementação Core
- [ ] T004: Implementar cálculo de ISS e cascata no `TaxEngineService` (fazer T002 ficar GREEN).
- [ ] T005: Implementar cálculo de Federais e ADR 005 no `TaxEngineService` (fazer T003 ficar GREEN).
- [ ] T006: Implementar suporte a Anexo IV com cessão de mão de obra para INSS.

#### Fase 3 — Interface para Pessoas (Inertia React)
*Não aplicável para esta spec técnica de motor.*

#### Fase 4 — Qualidade e Regressão
- [ ] T007: Implementar a matriz combinatória de 512 cenários em `tests/Unit/Domain/Fiscal/CombinatorialTaxMatrixTest.php`.
- [ ] T008: Executar Pest com 100% de cobertura nos métodos do `TaxEngineService`.

### 15. Ordem de execução
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências
Nenhuma dependência externa.

#### Riscos
Risco de arredondamento em centavos. Mitigação: usar `round($val, 2, PHP_ROUND_HALF_UP)`.

#### Suposições
Assume-se que a alíquota informada já é a efetiva ou nominal configurada para a empresa.

### 17. Decisões
- Aplicação estrita da ADR 005 (proibição de acumulação mensal retroativa).
- Manter o cálculo 100% puro e sem dependência do banco de dados.

### 18. Definition of Done
- 100% dos testes Pest aprovados.
- Tags `SPECSFY:` mapeadas em todos os testes.
- Zero dependência de frameworks externos ou SQL dentro do motor fiscal.
