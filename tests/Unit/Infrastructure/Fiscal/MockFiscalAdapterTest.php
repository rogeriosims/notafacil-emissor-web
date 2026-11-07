<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Fiscal;

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Infrastructure\Fiscal\Adapters\MockFiscalAdapter;
use App\Domain\Fiscal\DTOs\FiscalIssueResult;
use Tests\TestCase;

uses(TestCase::class)->group('SPECSFY: AC-002', 'SPECSFY: AC-003', 'SPECSFY: FR-002', 'fiscal');

test('Emissão bem-sucedida em memória sem rede', function () {
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 100.0,
        allowRetention: false,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: true,
        snRetentionSubject: false,
        issRate: 2.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: true
    );

    $adapter = new MockFiscalAdapter();

    $result = $adapter->issue($dto);

    expect($result)->toBeInstanceOf(FiscalIssueResult::class)
        ->and($result->status)->toBe('AUTHORIZED')
        ->and($result->trackingId)->toBe('MOCK-12345')
        ->and($result->xmlUrl)->not->toBeEmpty()
        ->and($result->pdfUrl)->not->toBeEmpty();
});

test('Simulação de erro controlado no driver mock', function () {
    $dto = new CanonicalInvoiceDTO(
        serviceValue: 100.0,
        allowRetention: false,
        opSimpNac: 1,
        issWithheldByTomador: false,
        issDueAtExecution: true,
        snRetentionSubject: false,
        issRate: 2.0,
        isAnexoIV: false,
        hasCessaoMaoDeObra: false,
        isTomadorCpf: true
    );

    $adapter = new MockFiscalAdapter();
    $adapter->simulateError(true);

    $result = $adapter->issue($dto);

    expect($result)->toBeInstanceOf(FiscalIssueResult::class)
        ->and($result->status)->toBe('ERROR')
        ->and($result->message)->toContain('Rejeição fiscal simulada');
});

test('Envio de certificado A1 válido para o provedor', function () {
    $adapter = new MockFiscalAdapter();
    
    $result = $adapter->syncCertificate('base64_cert_data', 'senha_valida');
    
    expect($result)->toBeTrue();
});

test('Falha de sincronismo com senha incorreta', function () {
    $adapter = new MockFiscalAdapter();
    
    $result = $adapter->syncCertificate('base64_cert_data', 'senha_invalida');
    
    expect($result)->toBeFalse();
});
