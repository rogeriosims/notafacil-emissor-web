<?php

declare(strict_types=1);

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\Services\TaxEngineService;

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-002
test('Dispensa legal de IRRF menor ou igual a R$ 10,00 por fato gerador', function () {
    $service = new TaxEngineService();
    // Valor: 600,00 * 1,5% = 9,00
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 600.0,
        allowRetention: true,
        opSimpNac: 1, // Não optante (para incidir federais)
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->irrf->isRetained)->toBeFalse()
        ->and($result->irrf->value)->toBe(0.0)
        ->and($result->irrf->dispensedByAdr005)->toBeTrue();
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-002
test('Retenção de IRRF acima de R$ 10,00', function () {
    $service = new TaxEngineService();
    // Valor: 1000,00 * 1,5% = 15,00
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->irrf->isRetained)->toBeTrue()
        ->and($result->irrf->value)->toBe(15.0)
        ->and($result->irrf->dispensedByAdr005)->toBeFalse();
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-002
test('Retenção de CSRF acima de R$ 10,00 com segregação de componentes', function () {
    $service = new TaxEngineService();
    // Valor: 1000,00 * 4,65% = 46,50
    // PIS (0,65%) = 6,50; COFINS (3,00%) = 30,00; CSLL (1,00%) = 10,00
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->csrf->isRetained)->toBeTrue()
        ->and($result->csrf->totalValue)->toBe(46.50)
        ->and($result->csrf->pisValue)->toBe(6.50)
        ->and($result->csrf->cofinsValue)->toBe(30.00)
        ->and($result->csrf->csllValue)->toBe(10.00)
        ->and($result->csrf->dispensedByAdr005)->toBeFalse();
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-002
test('Dispensa de CSRF menor ou igual a R$ 10,00', function () {
    $service = new TaxEngineService();
    // Valor: 200,00 * 4,65% = 9,30
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 200.0,
        allowRetention: true,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->csrf->isRetained)->toBeFalse()
        ->and($result->csrf->totalValue)->toBe(0.0)
        ->and($result->csrf->dispensedByAdr005)->toBeTrue();
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-002
test('Simples Nacional no Anexo IV com cessão de mão de obra retém INSS', function () {
    $service = new TaxEngineService();
    // Valor: 1000,00 * 11% = 110,00
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 3, // Simples Nacional
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: true,
        hasCessaoMaoDeObra: true,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    // Simples (mesmo Anexo IV) não retém IRRF e CSRF
    expect($result->inss->isRetained)->toBeTrue()
        ->and($result->inss->value)->toBe(110.0)
        ->and($result->irrf->isRetained)->toBeFalse()
        ->and($result->csrf->isRetained)->toBeFalse();
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-002
test('MEI e Simples Nacional (não anexo IV c/ cessão) nunca sofrem retenções federais', function () {
    $service = new TaxEngineService();
    // Valor: 1000,00
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 2, // MEI
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->inss->isRetained)->toBeFalse()
        ->and($result->irrf->isRetained)->toBeFalse()
        ->and($result->csrf->isRetained)->toBeFalse();
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-002
test('Tomador pessoa física (CPF) nunca retém tributos federais na fonte', function () {
    $service = new TaxEngineService();
    // Valor: 1000,00 * 4,65% = 46,50. Normal retém. Mas tomador CPF não.
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: true // CPF
    );

    $result = $service->calculate($dto);

    expect($result->irrf->isRetained)->toBeFalse()
        ->and($result->irrf->value)->toBe(0.0)
        ->and($result->csrf->isRetained)->toBeFalse()
        ->and($result->csrf->totalValue)->toBe(0.0);
});
