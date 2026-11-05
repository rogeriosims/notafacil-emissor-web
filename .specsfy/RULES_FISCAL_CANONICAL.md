# Decisões Fiscais Canônicas — Consolidadas do Histórico FiscalFlow

> Este documento consolida as **Decisões D-001 a D-013** extraídas das branches históricas do FiscalFlow para fundamentar a arquitetura das Specs do Laravel.

---

## 1. Regra D-012: O Caso do INSS no Simples Nacional Anexo IV
- **Fundamento Legal:** LC 123/2006, art. 18, §5º-C c/c IN RFB 971/2009, art. 191.
- **Regra:** Empresas do **Simples Nacional no Anexo IV** (construção civil, obras, vigilância e limpeza) que prestam serviços mediante cessão de mão de obra ou empreitada **SOFREM RETENÇÃO DE INSS NA FONTE**!
- **Alíquota:** **11,00% padrão** ou **3,50%** se a empresa tiver **CPRB (Desoneração da Folha)** conforme Lei 12.546/2011.
- **Modelagem:** `companies.is_simples_anexo_iv` (boolean) e `companies.has_cprb` (boolean).

---

## 2. Regra D-007: CSRF por Componente (PIS, COFINS, CSLL)
- **Fundamento Legal:** IN SRF 459/2004 c/c Nota Técnica 007/2026 da NFS-e Nacional.
- **Regra:** O motor trata PIS (0,65%), COFINS (3,00%) e CSLL (1,00%) como componentes independentes, permitindo suprimir componentes isolados em caso de cooperativas (3,65%), transporte internacional de valores (1,00%) ou liminares judiciais.
- O campo `tpRetPisCofins` e `vRetCSLL` da DPS reportam a combinação real retida.

---

## 3. Regra D-005 & D-006: Unicidade Global de CNPJ e Histórico na Transferência
- **Unicidade:** `companies.cnpj` é único globalmente no banco de dados. Um CNPJ não pode coexistir em dois escritórios simultaneamente.
- **Transferência Sigilosa:** A solicitação de transferência é intermediada pela plataforma sem revelar a identidade do escritório detentor para evitar espionagem concorrencial.
- **Histórico Fiscal Imutável:** A tabela `invoices` possui `issuing_office_id`. Ao transferir a empresa, o escritório que emitiu as notas mantém acesso de somente-leitura às notas autorizadas da sua época de gestão.

---

## 4. Regra D-011: Proibição de Default Silencioso (Fail-Fast)
- Se um parâmetro fiscal obrigatório (regime da empresa, código tributário municipal, etc.) estiver ausente no cadastro, a emissão é **bloqueada com erro amigável** indicando o campo faltante. O sistema jamais assume um regime tributário no escuro.

---

## 5. Ordem Estrita de Carga do CNS (Reforma Tributária IBS/CBS)
1. **Etapa 1:** Anexo B (Base ADN - 6 dígitos `cTribNac`) em `service_types`.
2. **Etapa 2:** Dicionário NBS (9 dígitos formatados) em `tax_taxonomy_master`.
3. **Etapa 3:** Anexo VIII (Reforma Tributária) correlacionando Serviço $\times$ NBS $\times$ `cClassTrib` $\times$ `INDOP`.
