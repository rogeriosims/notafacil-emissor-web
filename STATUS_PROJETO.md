# Status do Projeto — Nota Fácil Emissor Web

> **Documento de Auditoria, Histórico de Implementação e Status Atual**  
> **Data de Atualização:** 10 de Novembro de 2026  
> **Repositório:** `git@github.com:rogeriosims/notafacil-emissor-web.git`  
> **Branch Principal:** `main`  
> **Ambiente de Desenvolvimento:** WSL 2 (Ubuntu 24.04.4 LTS) no Windows  
> **Stack:** Laravel 11 + Inertia.js v2 + React 18 + TypeScript + TailwindCSS + PostgreSQL  

---

## 1. Visão Geral e Objetivo da Migração

O **Nota Fácil Emissor Web** é a reengenharia e modernização arquitetural completa do sistema legado **FiscalFlow** (originalmente desenvolvido em React SPA + Supabase / Deno Edge Functions). 

A migração seguiu as especificações executáveis geradas pela suíte de engenharia reversa **Reversa**, transicionando de um modelo serverless monolítico fragmentado para uma **Clean Architecture Hexagonal** robusta sobre **Laravel 11**, garantindo multi-tenancy hierárquico estrito, paridade tributária de 100% (ISS e tributos federais), emissão assíncrona resiliente e interfaces operacionais ricas.

---

## 2. O Que Foi Implementado Até Agora

### 2.1. Especificações Estruturais (Specs 0001 a 0009)

| Spec | Módulo / Funcionalidade | Descrição Técnica da Entrega | Status |
| :--- | :--- | :--- | :---: |
| **0001** | **Scaffolding & Multi-Tenancy** | Arquitetura multi-inquilino hierárquica em 3 níveis (`Platform Admin` $\to$ `Office` $\to$ `Company`). Global Scopes (`HierarchicalTenantScope`) e RBAC com papéis `PLATFORM_ADMIN`, `OFFICE_ADMIN`, `COMPANY_ADMIN`, `OPERATOR`. | Concluído |
| **0002** | **Migrations & Models Eloquent** | Modelagem relacional completa no PostgreSQL: empresas, escritórios, tomadores, serviços, RPS, notas fiscais (`invoices`), lotes (`invoice_batches`), certificados (`certificates`) e regras fiscais (`tax_rules`). | Concluído |
| **0003** | **Motor Fiscal (JsonLogic & Cascata)** | Domain Service compilado em PHP puro com avaliação de regras tributárias. Implementação da **cascata de 5 níveis de retenção de ISS** e cálculo de tributos federais (PIS, COFINS, CSLL, IRRF, INSS) com matriz de 512 cenários combinatórios validados. | Concluído |
| **0004** | **Provedor Fiscal Hexagonal** | Padrão Ports & Adapters com `IFiscalProvider`. Implementações concretas: `ACBrProvider` (API HTTP/REST homologada), `CrawlerProvider` e `MockProvider` (para simulações determinísticas de testes), orquestrados por `FiscalProviderFactory` e `FiscalManager`. | Concluído |
| **0005** | **Orquestração de Emissão & Polling** | Emissão transacional em 2 fases (reserva atômica de RPS + despacho assíncrono). Job `PollInvoiceStatusJob` com backoff exponencial (1s, 2s, 4s, 8s, 16s... max 300s) e reconciliação diária de notas pendentes. | Concluído |
| **0006** | **Importação em Lote Assíncrona** | Processamento de planilhas Excel/CSV via `maatwebsite/excel`. Fila assíncrona com validação prévia de linhas, geração atômica de invoices e progresso em tempo real. | Concluído |
| **0007** | **Frontend Inertia React 18** | Portabilidade completa das interfaces para Inertia v2 + React 18 com SSR e TypeScript. Componentes de UI modernos, validações no cliente e feedback com TailwindCSS e Lucide Icons. | Concluído |
| **0008** | **Paridade Fiscal Comportamental & Cutover** | Testes de paridade ponta a ponta com fixtures comparativas contra o legado. Comandos artisan de migração de dados e cutover de produção. | Concluído |
| **0009** | **Clonagem e Agendamento de Notas** | Duplicação inteligente de RPS com recalculo tributário atualizado. Rotina agendada (`invoices:process-scheduled`) no scheduler do Laravel para faturamento recorrente automático. | Concluído |

---

### 2.2. Portabilidade Completa de Gestão & Backoffice (Sem Simplificações)

Atendendo à exigência de paridade total com o legado, nenhuma tela ou fluxo foi omitido ou reduzido:

1. **Gestão de Escritórios Contábeis (`/management/offices`):**
   - CRUD completo de escritórios com estatísticas de empresas vinculadas, limites contratuais e status ativo/inativo.
2. **Gestão de Empresas (`/management/companies`):**
   - Edição e cadastro abrangente em abas: Dados Cadastrais (CNPJ, Razão Social, Nome Fantasia, Inscrição Municipal/Estadual), Endereço com busca CEP, Configurações de RPS e vínculo com escritório contábil.
3. **Gestão de Tomadores de Serviço (`/management/borrowers`):**
   - Cadastro detalhado com dados fiscais, tipo de pessoa (Física/Jurídica), endereço completo e validações automáticas de CPF/CNPJ.
4. **Gestão de Serviços Municipais (`/management/services`):**
   - Catálogo de serviços com código de tributação municipal, código da LC 116/2003, alíquotas padrão de ISS e flags de retenção obrigatória.
5. **Lookups Agnósticos de CEP e CNPJ:**
   - Serviço centralizado que busca dados cadastrais via ACBr com fallback transparente para serviços públicos (ViaCEP/BrasilAPI), sem expor acoplamento aos controllers.

---

### 2.3. Configurações da Empresa & Gestão de Certificado Digital A1

Implementação completa na rota `/companies/settings`:
- **5 Abas de Configuração Integrada:**
  1. *Dados Cadastrais:* Edição completa de razão social, CNPJ e contatos.
  2. *Endereço:* Logradouro, número, bairro, cidade, UF e CEP com preenchimento automático.
  3. *Regime Fiscal & RPS:* Regime tributário (Simples Nacional, Lucro Presumido, Real), alíquota padrão e controle de numeração/série do RPS.
  4. *Certificado Digital A1:* Visualização de certificado ativo (CNPJ emissor, data de validade, dias restantes para expiração).
  5. *Serviços Vinculados:* Listagem dos serviços habilitados para emissão da empresa.
- **Upload Real com OpenSSL:**
  - Validação criptográfica do arquivo `.pfx` ou `.p12` no backend via função nativa `openssl_pkcs12_read`.
  - Rejeição imediata caso a senha esteja incorreta ou o certificado esteja corrompido.
  - Extração automática da chave pública, CNPJ e validade.
  - Armazenamento seguro dos binários com criptografia simétrica AES-256 no banco de dados.

---

### 2.4. Backoffice Fiscal & Importação de Tabelas da LC 116

Implementação completa na rota `/management/tax-settings`:
- **Povoamento Automático (Seed):**
  - Botão de 1 clique para popular os **40 itens e subitens oficiais da Lei Complementar nº 116/2003** no banco de dados.
- **Importador de Planilhas CSV:**
  - Dropzone com suporte a drag-and-drop de arquivos CSV.
  - Detecção e conversão automática de codificação de caracteres (**UTF-8** e **ISO-8859-1 / Windows-1252**).
  - Atualização automática de alíquotas mínimas e máximas de ISS por município.

---

## 3. Cobertura de Testes e Qualidade de Código

A suíte de testes automatizados do Laravel cobre regressão de dados, isolamento de tenant e precisão de cálculos fiscais:

- **Total de Testes:** **65 testes automatizados**
- **Asserções Validadas:** **2.795 assertions**
- **Taxa de Sucesso:** **100% de aprovação (0 falhas, 0 erros)**
- **Testes de Paridade Fiscal:** Matriz combinatória de 512 cenários comparando saídas com os resultados legados do FiscalFlow.
- **Build Frontend:** 45 chunks JavaScript/CSS compilados via Vite sem nenhum aviso ou erro de tipagem TypeScript.

---

## 4. Mapa de Rotas e Telas Operacionais

### Rotas Web (Inertia.js)

| Rota | Descrição | Perfil Mínimo |
| :--- | :--- | :--- |
| `/login` | Autenticação unificada por e-mail e senha | Visitante |
| `/dashboard` | Dashboard analítico com gráficos de emissão e faturamento | Operador |
| `/invoices` | Listagem e filtros avançados de notas fiscais | Operador |
| `/invoices/create` | Formulário de emissão de NFSe com cálculo dinâmico de impostos | Operador |
| `/invoices/import` | Importação em lote de notas fiscais via planilha Excel/CSV | Operador |
| `/companies/settings` | Configurações da empresa ativa e upload de Certificado A1 | Administrador |
| `/management/offices` | Gestão de escritórios contábeis | Platform Admin |
| `/management/companies`| Gestão geral de empresas cadastradas | Office Admin |
| `/management/borrowers`| Gestão de tomadores de serviços | Operador |
| `/management/services` | Gestão de catálogo de serviços | Operador |
| `/management/tax-settings` | Backoffice fiscal (LC 116 e importação de tabelas) | Platform Admin |

### Rotas de API REST

| Método | Endpoint | Função |
| :--- | :--- | :--- |
| `POST` | `/api/invoices` | Emissão síncrona/assíncrona de NFSe |
| `GET` | `/api/invoices/{id}` | Consulta de status e XML/PDF de nota |
| `POST` | `/api/companies/{company}/certificate` | Upload e validação OpenSSL de Certificado A1 |
| `GET` | `/api/lookup/cep/{cep}` | Consulta agnóstica de CEP |
| `GET` | `/api/lookup/cnpj/{cnpj}`| Consulta agnóstica de CNPJ |
| `POST` | `/api/tax/simulate` | Simulação de alíquotas e retenções em tempo real |

---

## 5. Status Atual e Prontidão para Produção

- [x] Arquitetura Hexagonal e Injeção de Dependências implementadas.
- [x] Multi-tenancy hierárquico isolado e auditado por escopo global.
- [x] Motor tributário de ISS e tributos federais com paridade garantida.
- [x] Telas portadas integralmente em React 18 + Inertia v2.
- [x] Upload real de certificado digital A1 criptografado em repouso.
- [x] Tabela LC 116 e backoffice fiscal operacionais.
- [x] Jobs e filas assíncronas configuradas para processamento em background.
- [ ] Homologação final com as credenciais reais do provedor ACBr em ambiente de produção/staging.
