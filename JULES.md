# Diretrizes de Desenvolvimento Autônomo (Jules & Specsfy)

> Este arquivo orienta o agente autônomo Jules (Google) e outros agentes de IA no desenvolvimento do **Nota Fácil Emissor Web**.

---

## 1. Princípio Fundamental: Spec-Driven Development (Specsfy)

O desenvolvimento deste repositório é orientado a especificações formais rastreáveis pelo framework **Specsfy**.

- **Skills do Specsfy que o Jules DEVE carregar e assumir:**
  1. `specsfy-06-tdd-bdd` (`.agents/skills/specsfy-06-tdd-bdd/SKILL.md`): Conduz o ciclo Red-Green-Refactor com testes Pest contendo a tag `SPECSFY:`.
  2. `specsfy-07-implement` (`.agents/skills/specsfy-07-implement/SKILL.md`): Executa o checklist obrigatório (`PREP`, `EXECUTE`, `VERIFY`, `VISUAL`, `EVIDENCE`, `IMPROVE`) para cada tarefa.
  3. `specsfy-specialist-laravel` (`.agents/skills/specsfy-specialist-laravel/SKILL.md`): Padrões canônicos do Laravel 11, tipagem estrita, controllers finos, FormRequests, Policies e isolamento de tenant.
  4. `specsfy-specialist-postgres` (`.agents/skills/specsfy-specialist-postgres/SKILL.md`): Migrations com tipos rigorosos, foreign keys e índices.

- **Fonte Única da Verdade:** Toda tarefa executada deve pertencer à spec ativa em `specs/planned/<NNNN>-<slug>/spec.md`.
- **Proibido Código Sem Spec:** Nunca crie controllers, models, migrations ou regras de negócio que não estejam declaradas na seção 14 da spec ativa.
- **Ciclo TDD:** Antes de implementar código de produção, certifique-se de que o teste Pest correspondente em `tests/` foi derivado do BDD da spec.

---

## 2. Insumos Arquiteturais & Regras Canônicas

Consulte sempre os arquivos de fundação antes de tomar decisões técnicas:
1. `PROJECT.md`: Visão do produto, bounded contexts e limites do SaaS.
2. `.specsfy/STACK.md`: Laravel 11, PHP 8.3+, Inertia.js (React 18), Tailwind CSS, Pest, PostgreSQL, Redis.
3. `.specsfy/RULES.md`: Regras tributárias inegociáveis (ADR 005 - Piso R$ 10,00 sem acumulação mensal; teto ISS 5%).
4. `.specsfy/RULES_TENANCY.md`: Hierarquia em 3 níveis (Super Admin, Escritório, Empresas) e personificação com tarja visual.
5. `docs/reversa_sdd/`: Arqueologia extraída do sistema legado pelo Reversa (ERDs, Dicionário de Dados, Interfaces ACBr).

---

## 3. Padrões de Código Rigorosos (PHP 8.3 & Laravel 11)

- **Tipagem Estrita Obrigatória:** Todo arquivo PHP deve iniciar com `declare(strict_types=1);`.
- **Proibido Tipos Fracos:** Use tipos explícitos para parâmetros, retornos de função e propriedades de classe. Evite `mixed` a menos que estritamente necessário.
- **Enums Nativos:** Use enums nativos PHP para status e constantes de domínio (ex: `InvoiceStatus`, `UserRole`, `TaxRegime`).
- **Isolamento de Tenant:** Todo model pertencente a um tenant deve usar a trait `BelongsToTenant` e respeitar o `HierarchicalTenantScope`.
- **Motor Fiscal Puro:** Cálculos tributários residem exclusivamente em `App\Services\Fiscal\` como funções puras e determinísticas.
- **Convenção de Commits:** Conventional Commits em português ou inglês (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

---

## 4. Como Executar Cada Tarefa da Spec

1. Leia `specs/planned/<NNNN>-<slug>/spec.md`.
2. Pegue a próxima tarefa aberta em `### 14. Tarefas` (ex: `T001`, `T002`).
3. Siga o checklist obrigatório da tarefa:
   - `PREP`: Confirmar escopo e dependências.
   - `EXECUTE`: Escrever o teste ou código no caminho exato declarado.
   - `VERIFY`: Validar a execução local.
   - `VISUAL`: Se tocar interface, conferir contraste da tarja e responsividade.
   - `EVIDENCE`: Registrar comando e saída na spec.
4. Ao concluir todas as tarefas da spec, atualize o status para transição:
   ```bash
   specsfy transition <slug> review
   ```
