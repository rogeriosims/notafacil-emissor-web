<?php

declare(strict_types=1);

namespace App\Infrastructure\Fiscal\Adapters;

use App\Domain\Fiscal\Contracts\FiscalProviderInterface;
use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\DTOs\FiscalIssueResult;
use App\Domain\Fiscal\DTOs\FiscalStatusResult;
use App\Domain\Fiscal\DTOs\FiscalCancelResult;
use Illuminate\Support\Facades\Http;

class CrawlerFiscalAdapter implements FiscalProviderInterface
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct(array $config)
    {
        $this->baseUrl = rtrim($config['base_url'] ?? '', '/');
        $this->apiKey = $config['api_key'] ?? '';
        $this->timeout = (int) ($config['timeout'] ?? 15);
    }

    public function issue(CanonicalInvoiceDTO $dto): FiscalIssueResult
    {
        $response = Http::withHeaders(['X-API-Key' => $this->apiKey])
            ->timeout($this->timeout)
            ->post($this->baseUrl . '/emissao', [
                // Payload translation
            ]);

        return new FiscalIssueResult(
            status: 'PROCESSING',
            trackingId: 'CRAWL-123'
        );
    }

    public function checkStatus(string $trackingId): FiscalStatusResult
    {
        return new FiscalStatusResult(status: 'AUTHORIZED');
    }

    public function cancel(string $trackingId, string $reason): FiscalCancelResult
    {
        return new FiscalCancelResult(status: 'CANCELED');
    }

    public function downloadXml(string $trackingId): ?string
    {
        return null;
    }

    public function downloadPdf(string $trackingId): ?string
    {
        return null;
    }

    public function syncCertificate(string $base64Cert, string $password): bool
    {
        return true;
    }
}
