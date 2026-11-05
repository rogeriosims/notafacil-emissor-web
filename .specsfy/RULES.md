# Regras de Negócio e Invariantes do Sistema

## RF-01: Cálculo de ISS e Teto Legal
- A alíquota nominal ou efetiva de ISS nunca pode ser menor que 2,00% nem maior que 5,00% (LC 116/2003), exceto para empresas do Simples Nacional com alíquota segregada no DAS ou regimes especiais homologados.
- Qualquer alíquota $> 5,00\%$ informada sem justificativa legal deve ser rejeitada na camada de validação antes da submissão à prefeitura (prevenção do erro ADN E1300).

## RF-02: Hierarquia de Retenção de ISS (5 Níveis)
1. **Nível 1 (Serviço):** Se o serviço tem `allow_retention = false`, a retenção é sumariamente bloqueada.
2. **Nível 2 (Regime do Prestador):** Prestador MEI (`opSimpNac = 2`) nunca sofre retenção.
3. **Nível 3 (Tomador):** Tomador com flag `iss_withheld = true` (órgão público/substituto) força retenção.
4. **Nível 4 (Territorialidade):** Se `iss_due_at_execution = true`, o ISS é retido para o município de execução/tomador.
5. **Nível 5 (Simples Nacional):** Se o prestador é Simples (`opSimpNac = 3`), a retenção só ocorre se o serviço estiver marcado como `sn_retention_subject`.

## RF-03: Retenções Federais e Aplicação Estrita da ADR 005
- O sistema calcula INSS (11%), IRRF (1,5% padrão) e CSRF (4,65% unificado).
- **ADR 005 (Piso de R$ 10,00 por Fato Gerador):**
  - Se o valor calculado de IRRF for $\le$ R$ 10,00, a retenção está dispensada e deve ser gravada como 0,00.
  - Se o valor calculado da soma da CSRF for $\le$ R$ 10,00, a retenção está dispensada e deve ser gravada como 0,00.
  - **Proibição de Acumulação Mensal:** É expressamente vedado ao sistema consultar faturamentos anteriores no mês para somar e reter retroativamente (em consonância com a SC COSIT nº 258/2024).
- MEI e Simples Nacional nunca sofrem retenções federais na fonte.
- Tomador pessoa física (CPF) nunca retém tributos federais na fonte.

## RF-04: Numeração e Concorrência de DPS/RPS
- A numeração sequencial de DPS por empresa e série deve ser obtida sob lock pessimista de banco de dados (`SELECT FOR UPDATE`) para evitar duplicidade de envio sob concorrência.
