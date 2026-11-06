<?php

declare(strict_types=1);

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\Services\TaxEngineService;
use App\Domain\Fiscal\Exceptions\InvalidTaxRateException;

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-001
test('Serviço veda retenção na fonte (Nível 1 de prioridade)', function () {
    $service = new TaxEngineService();
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: false, // Nível 1: veda retenção
        opSimpNac: 1,
        issWithheldByTomador: true, // Mesmo que seja órgão público
        issDueAtExecution: true,
        snRetentionSubject: true,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->iss->isRetained)->toBeFalse()
        ->and($result->iss->value)->toBe(0.0);
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-001
test('Prestador optante pelo MEI nunca sofre retenção (Nível 2)', function () {
    $service = new TaxEngineService();
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 2, // MEI
        issWithheldByTomador: true,
        issDueAtExecution: true,
        snRetentionSubject: true,
        issRate: 3.0, // MEI technically doesn't use this for ISS calculation typically, but passing a valid one
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->iss->isRetained)->toBeFalse()
        ->and($result->iss->value)->toBe(0.0);
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-001
test('Tomador substituto tributário força retenção (Nível 3)', function () {
    $service = new TaxEngineService();
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 1, // Não optante (ex: Lucro Presumido)
        issWithheldByTomador: true,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 3.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->iss->isRetained)->toBeTrue()
        ->and($result->iss->value)->toBe(30.0);
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-001
test('Territorialidade - ISS devido no local de execução (Nível 4)', function () {
    $service = new TaxEngineService();
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: true,
        snRetentionSubject: false,
        issRate: 4.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->iss->isRetained)->toBeTrue()
        ->and($result->iss->value)->toBe(40.0);
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-001
test('Simples Nacional retenção sujeita (Nível 5)', function () {
    $service = new TaxEngineService();
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 3, // Simples
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: true,
        issRate: 2.5,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $result = $service->calculate($dto);

    expect($result->iss->isRetained)->toBeTrue()
        ->and($result->iss->value)->toBe(25.0);
});

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-003
test('Alíquota de ISS abaixo do piso constitucional de 2% (AC-003)', function () {
    $service = new TaxEngineService();
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 1.5,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $service->calculate($dto);
})->throws(InvalidTaxRateException::class);

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-003
test('Alíquota de ISS acima do teto constitucional de 5% (AC-003)', function () {
    $service = new TaxEngineService();
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 1000.0,
        allowRetention: true,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: false,
        snRetentionSubject: false,
        issRate: 5.5,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: false
    );

    $service->calculate($dto);
})->throws(InvalidTaxRateException::class);

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-003
test('Alíquota de ISS regular dentro da faixa legal (AC-003)', function () {
    $service = new TaxEngineService();
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

    // Nível 1 a 5 não bate retenção, só valida alíquota
    expect($result->iss->isRetained)->toBeFalse()
        ->and($result->iss->value)->toBe(0.0);
});
