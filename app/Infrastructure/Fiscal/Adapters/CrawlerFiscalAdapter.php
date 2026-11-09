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

    public function lookupCnpj(string $cnpj): CnpjLookupResult
    {
        $clean = preg_replace('/\D/', '', $cnpj);
        // Fallback básico para BrasilAPI
        $resp = Http::timeout(10)->get("https://brasilapi.com.br/api/cnpj/v1/{$clean}");
        if ($resp->successful()) {
            $data = $resp->json();
            return new CnpjLookupResult(
                cnpj: $clean,
                companyName: $data['razao_social'] ?? '',
                tradeName: $data['nome_fantasia'] ?? $data['razao_social'] ?? '',
                status: $data['descricao_situacao_cadastral'] ?? 'ATIVA',
                address: [
                    'street' => $data['logradouro'] ?? '',
                    'number' => $data['numero'] ?? '',
                    'complement' => $data['complemento'] ?? '',
                    'neighborhood' => $data['bairro'] ?? '',
                    'city' => $data['municipio'] ?? '',
                    'state' => $data['uf'] ?? '',
                    'zipCode' => $data['cep'] ?? '',
                    'ibgeCode' => (string) ($data['codigo_municipio_ibge'] ?? ''),
                ],
                taxStatus: $data['opcao_pelo_simples'] ? 'simples_nacional' : 'demais',
                cnae: (string) ($data['cnae_fiscal'] ?? ''),
                source: 'BRASIL_API'
            );
        }

        throw new \RuntimeException("Erro ao consultar CNPJ via Crawler: " . $resp->body());
    }

    public function lookupCep(string $cep): CepLookupResult
    {
        $clean = preg_replace('/\D/', '', $cep);
        $resp = Http::timeout(10)->get("https://viacep.com.br/ws/{$clean}/json/");
        if ($resp->successful() && !isset($resp['erro'])) {
            $data = $resp->json();
            return new CepLookupResult(
                cep: $clean,
                street: $data['logradouro'] ?? '',
                neighborhood: $data['bairro'] ?? '',
                city: $data['localidade'] ?? '',
                state: $data['uf'] ?? '',
                ibgeCode: $data['ibge'] ?? '',
                source: 'VIACEP'
            );
        }

        throw new \RuntimeException("Erro ao consultar CEP via Crawler: " . $resp->body());
    }
}
