| Campo | Valor |
|---|---|
| Identificador | 0001-scaffolding-multi-tenancy |
| Título | Scaffolding Laravel 11, Autenticação e Multi-Tenancy Seguro |
| Status | Defined |
| Effort | 4 |
| Effort updated at | 2026-11-05 |
| Effort rationale | Configuração inicial de framework, banco, autenticação Breeze/Sanctum e implementação do Global Scope de tenant. Complexidade standard com testes de isolamento. |

# 0001: Scaffolding Laravel 11, Autenticação e Multi-Tenancy Seguro

## 1. Contexto e Problema
O FiscalFlow opera no modelo SaaS multi-tenant onde escritórios de contabilidade (`Offices`) gerenciam empresas clientes (`Companies`) e operadores (`Users`). No sistema legado, a segregação dependia exclusivamente de RLS (Row Level Security) no PostgreSQL, deixando consultas executadas em backend desprotegidas contra vazamento acidental de dados (falha **LOGIC-009** catalogada pelo Inquisitor).

## 2. Objetivo da Spec
Estabelecer o esqueleto do projeto Laravel 11 com suporte a autenticação, estrutura de banco de dados e garantia de isolamento multi-tenant automático via `TenantScope` no Eloquent.

## 3. Requisitos Funcionais
- [ ] Criação das migrations base: `offices`, `users`, `invites`.
- [ ] Criação dos Models com tipagem estrita PHP 8.3: `Office`, `User`, `Invite`.
- [ ] Implementação de `App\Models\Scopes\TenantScope` que aplica automaticamente `where('office_id', $currentOfficeId)` em todas as consultas.
- [ ] Implementação da Trait `App\Models\Concerns\BelongsToTenant` que injeta o scope e auto-preenche o `office_id` na criação de registros.
- [ ] Middleware `EnsureTenantContext` que resolve o `Office` ativo da sessão/token JWT.

## 4. Critérios de Aceite e Verificação
- [ ] **Cenário 1 (Isolamento de Leitura):** Quando um usuário autenticado no Office A tenta listar empresas ou faturas via Eloquent, nenhum registro pertencente ao Office B é retornado, mesmo que o ID seja explicitamente passado em queries sem bypass.
- [ ] **Cenário 2 (Gravação Segura):** Ao criar um novo registro usando o model com `BelongsToTenant`, o `office_id` é herdado automaticamente da sessão autenticada.
- [ ] **Cenário 3 (Testes Automatizados):** Suíte Pest com testes de isolamento multi-tenant executando com 100% de sucesso.
