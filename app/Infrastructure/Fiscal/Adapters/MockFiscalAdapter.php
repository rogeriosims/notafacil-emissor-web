<?php

declare(strict_types=1);

namespace App\Infrastructure\Fiscal\Adapters;

use App\Domain\Fiscal\Contracts\FiscalProviderInterface;
use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\DTOs\FiscalIssueResult;
use App\Domain\Fiscal\DTOs\FiscalStatusResult;
use App\Domain\Fiscal\DTOs\FiscalCancelResult;
use App\Domain\Fiscal\DTOs\CnpjLookupResult;
use App\Domain\Fiscal\DTOs\CepLookupResult;

class MockFiscalAdapter implements FiscalProviderInterface
{
    private bool $simulateError = false;

    public function simulateError(bool $simulateError): void
    {
        $this->simulateError = $simulateError;
    }

    public function issue(CanonicalInvoiceDTO $dto): FiscalIssueResult
    {
        if ($this->simulateError) {
            return new FiscalIssueResult(
                status: 'ERROR',
                message: 'Rejeição fiscal simulada'
            );
        }

        return new FiscalIssueResult(
            status: 'AUTHORIZED',
            trackingId: 'MOCK-12345',
            xmlUrl: 'http://mock.test/xml',
            pdfUrl: 'http://mock.test/pdf'
        );
    }

    public function checkStatus(string $trackingId): FiscalStatusResult
    {
        return new FiscalStatusResult(
            status: 'AUTHORIZED',
            xmlUrl: 'http://mock.test/xml',
            pdfUrl: 'http://mock.test/pdf'
        );
    }

    public function cancel(string $trackingId, string $reason): FiscalCancelResult
    {
        return new FiscalCancelResult(
            status: 'CANCELED'
        );
    }

    public function downloadXml(string $trackingId): ?string
    {
        return '<xml>Mock</xml>';
    }

    public function downloadPdf(string $trackingId): ?string
    {
        return 'mock-pdf-content';
    }

    public function syncCertificate(string $base64Cert, string $password): bool
    {
        if ($password !== 'senha_valida') {
            return false;
        }
        
        return true;
    }

    public function lookupCnpj(string $cnpj): CnpjLookupResult
    {
        $clean = preg_replace('/\D/', '', $cnpj);

        return new CnpjLookupResult(
            cnpj: $clean,
            companyName: 'EMPRESA MOCK TECNOLOGIA LTDA',
            tradeName: 'MOCK TECH',
            status: 'ATIVA',
            address: [
                'street' => 'Avenida Paulista',
                'number' => '1000',
                'complement' => 'Andar 10',
                'neighborhood' => 'Bela Vista',
                'city' => 'São Paulo',
                'state' => 'SP',
                'zipCode' => '01310100',
                'ibgeCode' => '3550308',
            ],
            taxStatus: 'simples_nacional',
            cnae: '6201-5/01',
            source: 'MOCK'
        );
    }

    public function lookupCep(string $cep): CepLookupResult
    {
        $clean = preg_replace('/\D/', '', $cep);

        return new CepLookupResult(
            cep: $clean,
            street: 'Praça da Sé',
            neighborhood: 'Sé',
            city: 'São Paulo',
            state: 'SP',
            ibgeCode: '3550308',
            source: 'MOCK'
        );
    }
}
