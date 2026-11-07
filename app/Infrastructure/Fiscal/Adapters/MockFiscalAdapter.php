<?php

declare(strict_types=1);

namespace App\Infrastructure\Fiscal\Adapters;

use App\Domain\Fiscal\Contracts\FiscalProviderInterface;
use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\DTOs\FiscalIssueResult;
use App\Domain\Fiscal\DTOs\FiscalStatusResult;
use App\Domain\Fiscal\DTOs\FiscalCancelResult;

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
}
