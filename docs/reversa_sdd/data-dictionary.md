# Dicionário de Dados — FiscalFlow

> Gerado pelo agente Data Master / Archaeologist em 2026-11-05.  
> Fonte: migrações SQL + tipos TypeScript do frontend.

---

## Tabela: `offices` (Escritórios Contábeis)

| Coluna | Tipo SQL | Tipo TS | Nullable | Padrão | Descrição |
|--------|----------|---------|----------|--------|-----------|
| `id` | uuid | string | NO | uuid_generate_v4() | PK |
| `name` | text | string | NO | — | Razão social do escritório |
| `cnpj` | text | string? | YES | — | CNPJ do escritório (sem máscara) |
| `status` | text | 'ACTIVE'\|'SUSPENDED' | YES | — | Estado operacional |
| `plan` | text | 'STARTER'\|'GROWTH'\|'ENTERPRISE' | YES | — | **Legado** — substituído por `subscription` |
| `subscription` | jsonb | OfficeSubscription | YES | — | `{ planId, status:'ACTIVE'\|'PAST_DUE'\|'CANCELED'\|'TRIAL', cycleStart, nextBillingDate, currentUsage }` |
| `created_at` | timestamptz | string | YES | now() | — |

---

## Tabela: `subscription_plans` (Planos de Assinatura)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `name` | text | NO | — | Nome do plano |
| `description` | text | YES | — | Descrição |
| `base_price` | numeric | NO | — | Valor fixo mensal (R$) |
| `monthly_quota` | integer | NO | — | Notas incluídas por mês |
| `overage_price` | numeric | NO | — | Preço por nota excedente (R$) |
| `features` | jsonb | YES | — | Array de strings com features |
| `color` | text | YES | — | Cor UI do plano |

---

## Tabela: `profiles` (Usuários)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | — | PK = FK → `auth.users.id` |
| `office_id` | uuid | YES | — | FK → `offices.id` |
| `company_id` | uuid | YES | — | FK → `companies.id` (CLIENT_ADMIN/USER) |
| `name` | text | YES | — | Nome completo |
| `email` | text | YES | — | E-mail (espelho de auth.users) |
| `role` | text | NO | — | `PLATFORM_ADMIN\|OFFICE_ADMIN\|CLIENT_ADMIN\|USER` |
| `avatar_url` | text | YES | — | URL do avatar |
| `created_at` | timestamptz | YES | now() | — |

**Nota:** Criado automaticamente via trigger `on_auth_user_created` ao novo registro em `auth.users`.

---

## Tabela: `office_invites` (Convites)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `office_id` | uuid | NO | — | FK → `offices.id` |
| `email` | text | NO | — | E-mail convidado |
| `name` | text | NO | — | Nome do convidado |
| `role` | text | NO | — | Role que será atribuída ao aceitar |
| `status` | text | NO | — | `PENDING\|ACCEPTED\|EXPIRED` |
| `created_at` | timestamptz | YES | now() | — |
| `expires_at` | timestamptz | YES | — | Expiração do convite |

---

## Tabela: `companies` (Empresas Emitentes)

| Coluna | Tipo SQL | Tipo TS | Nullable | Padrão | Descrição |
|--------|----------|---------|----------|--------|-----------|
| `id` | uuid | string | NO | uuid_generate_v4() | PK |
| `office_id` | uuid | string | NO | — | FK → `offices.id` |
| `name` | text | string | NO | — | Razão social |
| `trade_name` | text | string? | YES | — | Nome fantasia |
| `cnpj` | text | string | NO | — | CNPJ sem máscara |
| `status` | text | 'ACTIVE'\|'PENDING'\|'SUSPENDED' | YES | 'PENDING' | Estado da empresa |
| `email` | text | string? | YES | — | E-mail de contato |
| `phone` | text | string? | YES | — | Telefone |
| `municipal_registration` | text | string? | YES | — | Inscrição Municipal |
| `tax_regime` | text | string? | YES | — | `SIMPLES_NACIONAL\|LUCRO_PRESUMIDO\|LUCRO_REAL` |
| `environment` | text | string? | YES | — | `homologacao\|producao` |
| `tax_incentive` | boolean | boolean? | YES | false | Empresa com incentivo fiscal |
| `iss_rate` | numeric | number? | YES | 0 | Alíquota ISS padrão da empresa |
| `address` | jsonb | Address | YES | — | `{ cep, street, number, neighborhood, city, state, ibgeCode, complement }` |
| `certificate` | jsonb | CertificateInfo | YES | — | `{ hasCertificate, expirationDate, thumbprint, subject: { cnpj, commonName } }` |
| `reg_trib` | jsonb | RegTrib | YES | — | `{ opSimpNac:1\|2\|3, regEspTrib:0-6, regApTribSN:1\|2\|3\|null }` |
| `rps` | jsonb | RpsConfig | YES | — | `{ lote:int, serie:string, numero:int }` |
| `city_hall` | jsonb | CityHallCredentials | YES | — | `{ login, senha, token }` — credenciais prefeitura |
| `settings` | jsonb | object | YES | '{}' | Configurações dual-environment `{ homologacao:{...}, producao:{...} }` |
| `logo_url` | text | string? | YES | — | URL do logotipo |
| `fiscal_provider` | text | string? | YES | 'acbr' | Provedor fiscal ativo |
| `provider_company_id` | text | string? | YES | — | ID agnóstico no provedor |
| `acbr_company_id` | text | string? | YES | — | ID específico ACBr |
| `nuvem_fiscal_company_id` | text | string? | YES | — | **Legado** Nuvem Fiscal |
| `created_at` | timestamptz | — | YES | now() | — |

### Detalhamento: `reg_trib` (jsonb)
```json
{
  "opSimpNac": 1,       // 1=Regime Geral, 2=MEI, 3=ME/EPP Simples Nacional
  "regEspTrib": 0,      // 0=Nenhum, 1=Coop, 2=Estimat, 3=ME Mun, 4=Notário, 5=Autônomo, 6=Soc.Prof
  "regApTribSN": null   // 1,2,3 — somente se opSimpNac=3; null caso contrário
}
```

---

## Tabela: `borrowers` (Tomadores de Serviço)

| Coluna | Tipo SQL | Tipo TS | Nullable | Padrão | Descrição |
|--------|----------|---------|----------|--------|-----------|
| `id` | uuid | string | NO | uuid_generate_v4() | PK |
| `company_id` | uuid | string | NO | — | FK → `companies.id` |
| `tax_id` | text | string | NO | — | CPF (11 dígitos) ou CNPJ (14 dígitos) |
| `name` | text | string | NO | — | Razão social ou nome |
| `email` | text | string? | YES | — | E-mail |
| `phone` | text | string? | YES | — | Telefone |
| `municipal_registration` | text | string? | YES | — | Inscrição Municipal |
| `iss_withheld` | boolean | boolean? | YES | false | Tomador retém ISS (nível 3 da hierarquia) |
| `address` | jsonb | Address | NO | — | Endereço completo com ibgeCode obrigatório |
| `created_at` | timestamptz | — | YES | now() | — |

**Constraint de unicidade:** `(company_id, tax_id)` — cada empresa tem apenas um registro por tomador.

---

## Tabela: `service_types` (Tipos de Serviço Nacionais)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `ctribnac` | text | NO | — | Código tributário nacional — 6 dígitos (ex: `170101`) |
| `description` | text | NO | — | Descrição do serviço |
| `is_due_at_execution` | boolean | YES | — | ISS devido no local de prestação |
| `allows_deduction` | boolean | YES | — | Permite dedução da base de cálculo |
| `default_nbs` | text | YES | — | NBS padrão sugerido |
| `mandatory_retention_suggestion` | boolean | YES | — | Sugestão de retenção obrigatória |

---

## Tabela: `tax_taxonomy_master` (Taxonomia NBS)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `parent_id` | uuid | YES | — | FK → `tax_taxonomy_master.id` (autorreferência) |
| `code` | text | NO | — | Código LC116 (ex: `1.05`) |
| `nbs` | text | YES | — | Código NBS completo (ex: `1.05.01.00`) |
| `description` | text | NO | — | Descrição do capítulo/item |
| `hierarchy_level` | integer | NO | — | Nível hierárquico (0=raiz, 1=capítulo, 2=subitem, etc.) |
| `is_leaf` | boolean | NO | — | Se é folha (nó terminal, sem filhos) |

---

## Tabela: `service_items` (Catálogo de Serviços da Empresa)

| Coluna | Tipo SQL | Tipo TS | Nullable | Padrão | Descrição |
|--------|----------|---------|----------|--------|-----------|
| `id` | uuid | string | NO | uuid_generate_v4() | PK |
| `company_id` | uuid | string | NO | — | FK → `companies.id` |
| `service_type_id` | uuid | string | NO | — | FK → `service_types.id` |
| `taxonomy_id` | uuid | string? | YES | — | FK → `tax_taxonomy_master.id` |
| `description` | text | string | NO | — | Descrição interna do serviço |
| `unit_price` | numeric | number | YES | — | Preço unitário padrão |
| `iss_aliquot` | numeric | number | NO | — | Alíquota ISS (ex: 2.00, 5.00) |
| `municipal_tax_code` | text | string? | YES | — | cTribMun (código municipal — máx 5 chars) |
| `nbs` | text | string? | YES | — | Código NBS override / desnormalizado |
| `allow_retention` | boolean | boolean | NO | — | **Master switch** — se false, nunca retém |
| `sn_retention_subject` | boolean | boolean? | YES | — | Retenção quando prestador é Simples Nacional |
| `general_regime_retention_subject` | boolean | boolean? | YES | — | Retenção quando prestador é Lucro Real/Presumido |
| `created_at` | timestamptz | — | YES | now() | — |

---

## Tabela: `invoices` (Notas Fiscais)

| Coluna | Tipo SQL | Tipo TS | Nullable | Padrão | Descrição |
|--------|----------|---------|----------|--------|-----------|
| `id` | uuid | string | NO | uuid_generate_v4() | PK |
| `company_id` | uuid | string | NO | — | FK → `companies.id` |
| `batch_id` | uuid | string? | YES | — | FK → `invoice_batches.id` |
| `number` | integer | number? | YES | — | Número sequencial da NFS-e |
| `borrower_name` | text | string | NO | — | Nome do tomador (desnormalizado) |
| `borrower_cnpj` | text | string | NO | — | CPF/CNPJ do tomador (desnormalizado) |
| `amount` | numeric | number | NO | — | Valor bruto do serviço |
| `discount_amount` | numeric | number? | YES | 0 | Desconto incondicionado |
| `iss_aliquot` | numeric | number? | YES | 0 | Alíquota ISS aplicada |
| `iss_amount` | numeric | number? | YES | 0 | Valor do ISS calculado |
| `iss_withheld` | boolean | boolean? | YES | false | Se o ISS foi retido pelo tomador |
| `service_code` | text | string | NO | — | Código do serviço (cTribNac) |
| `description` | text | string? | YES | — | Discriminação dos serviços |
| `status` | text | string | YES | 'DRAFT' | Estado da nota (ver enum invoice_status) |
| `environment` | text | string? | YES | — | `homologacao\|producao` |
| `fiscal_provider` | text | string? | YES | — | Provedor usado na emissão |
| `provider_invoice_id` | text | string? | YES | — | ID no provedor (agnóstico) |
| `acbr_id` | text | string? | YES | — | ID específico ACBr |
| `nuvem_fiscal_id` | text | string? | YES | — | **Legado** |
| `verification_code` | text | string? | YES | — | Código verificador da NFS-e |
| `access_key` | text | string? | YES | — | Chave de acesso |
| `pdf_url` | text | string? | YES | — | URL do PDF da DANFSE |
| `xml_url` | text | string? | YES | — | URL do XML autorizado |
| `cancel_xml_url` | text | string? | YES | — | URL do XML de cancelamento |
| `cancel_pdf_url` | text | string? | YES | — | URL do PDF de cancelamento |
| `cancellation_data` | jsonb | object? | YES | — | `{ id, codigo, motivo, data_hora }` |
| `iss_snapshot` | jsonb | object? | YES | — | Snapshot imutável do cálculo fiscal |
| `borrower_snapshot` | jsonb | object? | YES | — | Snapshot imutável dos dados do tomador |
| `logs` | jsonb | InvoiceLog[] | YES | '[]' | Histórico de eventos da nota |
| `issued_at` | timestamptz | string | YES | now() | Data de emissão/criação |
| `competence_date` | timestamptz | string | YES | — | Mês/ano de competência fiscal |
| `updated_at` | timestamptz | — | YES | now() | Última atualização |

### Detalhamento: `iss_snapshot` (jsonb)
```json
{
  "pAliq": 5.00,
  "vISSQN": 500.00,
  "vBC": 10000.00,
  "vDesc": 0,
  "cTribNac_usado": "170101",
  "cTribMun_usado": "0107",
  "nbs_usado": "1.07.01.00",
  "tpRetISSQN_calculado": 2,
  "vLiq": 9500.00,
  "origem_aliquota": "CATALOG | CATALOG_BATCH",
  "origem_retencao": "SERVICE | PROVIDER | BORROWER | MUNICIPALITY | COMBO | AUTO_BATCH"
}
```

### Detalhamento: `borrower_snapshot` (jsonb)
```json
{
  "id": "uuid-do-tomador",
  "nome": "Empresa Tomadora LTDA",
  "cnpj": "12345678000190",
  "inscricao_municipal": "123456",
  "endereco_completo": {
    "street": "Rua das Flores",
    "number": "100",
    "complement": "Sala 1",
    "neighborhood": "Centro",
    "city": "Belo Horizonte",
    "state": "MG",
    "cep": "30000000",
    "ibgeCode": "3106200"
  },
  "origem": "BORROWER_DB | BATCH_IMPORT"
}
```

### Detalhamento: `logs` (jsonb array)
```json
[
  {
    "timestamp": "2026-11-05T12:00:00.000Z",
    "level": "INFO",
    "message": "Nota Autorizada com Sucesso",
    "details": "nfse-id-acbr-123",
    "link_url": "https://..."
  }
]
```

---

## Tabela: `invoice_batches` (Lotes de Importação)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `company_id` | uuid | NO | — | FK → `companies.id` |
| `name` | text | YES | — | Nome do lote (ex: "Lote 05/11/2026") |
| `status` | text | NO | — | `OPEN\|PROCESSING\|COMPLETED\|ARCHIVED` |
| `total_records` | integer | YES | 0 | Total de linhas recebidas |
| `processed_count` | integer | YES | 0 | Notas importadas com sucesso |
| `error_count` | integer | YES | 0 | Linhas com erro |
| `created_at` | timestamptz | YES | now() | — |

---

## Tabela: `invoice_payloads` (Auditoria de Payloads)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `invoice_id` | uuid | NO | — | FK → `invoices.id` |
| `direction` | text | NO | — | `'sent'` (enviado ao provedor) ou `'received'` (resposta) |
| `payload` | jsonb | NO | — | Payload bruto enviado/recebido |
| `created_at` | timestamptz | YES | now() | — |

---

## Tabela: `municipalities` (Municípios IBGE)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `ibge_code` | text | NO UNIQUE | — | Código IBGE de 7 dígitos |
| `name` | text | NO | — | Nome do município |
| `uf` | text | NO | — | Sigla do estado (ex: MG, SP) |
| `uses_portal_nacional` | boolean | YES | — | Suporta Portal Nacional NFS-e |
| `suppress_municipal_tax_code` | boolean | YES | — | Suprimir cTribMun no XML |
| `iss_default_aliquots` | jsonb | YES | — | `[ { serviceCode, aliquot } ]` |
| `nfs_rules` | text | YES | — | Regras específicas da prefeitura |

---

## Tabela: `platform_analytics` (Analytics de Plataforma)

| Coluna | Tipo SQL | Nullable | Padrão | Descrição |
|--------|----------|----------|--------|-----------|
| `id` | uuid | NO | uuid_generate_v4() | PK |
| `event_type` | text | NO | — | Tipo de evento (ex: `invoice_issued`, `company_synced`) |
| `payload` | jsonb | YES | — | Dados do evento |
| `created_at` | timestamptz | YES | now() | — |

---

## Mapeamentos de Campos Legados → Agnósticos

| Tabela | Campo Legado | Campo Agnóstico | Notas |
|--------|-------------|-----------------|-------|
| `companies` | `nuvem_fiscal_company_id` | `provider_company_id` | Migrado em 20260301 |
| `companies` | `nuvem_fiscal_company_id` | `acbr_company_id` | Espelho para ACBr |
| `invoices` | `nuvem_fiscal_id` | `provider_invoice_id` | Migrado em 20260301 |
| `invoices` | `nuvem_fiscal_id` | `acbr_id` | Espelho para ACBr |
