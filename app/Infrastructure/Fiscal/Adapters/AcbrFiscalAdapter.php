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
use Illuminate\Support\Facades\Log;

class AcbrFiscalAdapter implements FiscalProviderInterface
{
    private string $baseUrl;
    private string $token;
    private int $timeout;

    public function __construct(array $config)
    {
        $this->baseUrl = rtrim($config['base_url'] ?? '', '/');
        $this->token = $config['token'] ?? '';
        $this->timeout = (int) ($config['timeout'] ?? 15);
    }

    public function issue(CanonicalInvoiceDTO $dto): FiscalIssueResult
    {
        $response = Http::withToken($this->token)
            ->timeout($this->timeout)
            ->post($this->baseUrl . '/issue', [
                // Payload translation
            ]);

        return new FiscalIssueResult(
            status: 'PROCESSING',
            trackingId: 'ACBR-123'
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

        // 1. Tentar prioritariamente via ACBr API se houver token configurado
        if (!empty($this->token) && !empty($this->baseUrl)) {
            try {
                $response = Http::withToken($this->token)
                    ->timeout($this->timeout)
                    ->get("{$this->baseUrl}/cnpj/{$clean}");

                if ($response->successful()) {
                    $res = $response->json();
                    $end = $res['endereco'] ?? [];
                    $cityObj = is_array($end['city'] ?? null) ? $end['city'] : null;
                    $munObj = is_array($end['municipio'] ?? null) ? $end['municipio'] : null;

                    $cityName = $cityObj['descricao'] ?? ($munObj['descricao'] ?? ($end['municipio'] ?? ''));
                    $ibgeCode = $cityObj['codigo_ibge'] ?? ($munObj['codigo_ibge'] ?? ($end['codigo_municipio'] ?? ''));

                    $statusStr = 'ATIVA';
                    if (is_string($res['status'] ?? null)) {
                        $statusStr = $res['status'];
                    } elseif (isset($res['situacao_cadastral']['descricao'])) {
                        $statusStr = (string) $res['situacao_cadastral']['descricao'];
                    }

                    return new CnpjLookupResult(
                        cnpj: $clean,
                        companyName: $res['companyName'] ?? ($res['nome_razao_social'] ?? ($res['razao_social'] ?? '')),
                        tradeName: $res['tradeName'] ?? ($res['nome_fantasia'] ?? null),
                        status: $statusStr,
                        address: [
                            'street' => $end['street'] ?? ($end['logradouro'] ?? ''),
                            'number' => $end['number'] ?? ($end['numero'] ?? ''),
                            'complement' => $end['complement'] ?? ($end['complemento'] ?? ''),
                            'neighborhood' => $end['neighborhood'] ?? ($end['bairro'] ?? ''),
                            'city' => (string) $cityName,
                            'state' => $end['state'] ?? ($end['uf'] ?? ''),
                            'zipCode' => $end['cep'] ?? '',
                            'ibgeCode' => (string) $ibgeCode,
                        ],
                        taxStatus: $res['taxStatus'] ?? ($res['regime_tributario'] ?? null),
                        cnae: $res['cnae'] ?? null,
                        source: 'ACBR'
                    );
                }
            } catch (\Throwable $e) {
                Log::warning("Falha ao consultar CNPJ {$clean} no ACBr, ativando fallback BrasilAPI", ['error' => $e->getMessage()]);
            }
        }

        // 2. Fallback automático transparente: BrasilAPI
        try {
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
                        'zipCode' => preg_replace('/\D/', '', $data['cep'] ?? ''),
                        'ibgeCode' => (string) ($data['codigo_municipio_ibge'] ?? ''),
                    ],
                    taxStatus: ($data['opcao_pelo_simples'] ?? false) ? 'simples_nacional' : 'demais',
                    cnae: (string) ($data['cnae_fiscal'] ?? ''),
                    source: 'BRASIL_API_FALLBACK'
                );
            }
        } catch (\Throwable $e) {
            Log::error("Falha no fallback de CNPJ BrasilAPI para {$clean}", ['error' => $e->getMessage()]);
        }

        throw new \RuntimeException("Não foi possível consultar os dados do CNPJ {$clean} no provedor fiscal nem no fallback.");
    }

    public function lookupCep(string $cep): CepLookupResult
    {
        $clean = preg_replace('/\D/', '', $cep);

        // 1. Tentar prioritariamente via ACBr API se houver token configurado
        if (!empty($this->token) && !empty($this->baseUrl)) {
            try {
                $response = Http::withToken($this->token)
                    ->timeout($this->timeout)
                    ->get("{$this->baseUrl}/cep/{$clean}");

                if ($response->successful()) {
                    $res = $response->json();
                    return new CepLookupResult(
                        cep: $clean,
                        street: $res['logradouro'] ?? ($res['street'] ?? ''),
                        neighborhood: $res['bairro'] ?? ($res['neighborhood'] ?? ''),
                        city: $res['municipio'] ?? ($res['city'] ?? ''),
                        state: $res['uf'] ?? ($res['state'] ?? ''),
                        ibgeCode: (string) ($res['codigo_municipio'] ?? ($res['ibgeCode'] ?? '')),
                        source: 'ACBR'
                    );
                }
            } catch (\Throwable $e) {
                Log::warning("Falha ao consultar CEP {$clean} no ACBr, ativando fallback ViaCEP", ['error' => $e->getMessage()]);
            }
        }

        // 2. Fallback automático transparente: ViaCEP com código IBGE
        try {
            $resp = Http::timeout(10)->get("https://viacep.com.br/ws/{$clean}/json/");
            if ($resp->successful() && !isset($resp['erro'])) {
                $data = $resp->json();
                return new CepLookupResult(
                    cep: $clean,
                    street: $data['logradouro'] ?? '',
                    neighborhood: $data['bairro'] ?? '',
                    city: $data['localidade'] ?? '',
                    state: $data['uf'] ?? '',
                    ibgeCode: (string) ($data['ibge'] ?? ''),
                    source: 'VIACEP_FALLBACK'
                );
            }
        } catch (\Throwable $e) {
            Log::error("Falha no fallback de CEP ViaCEP para {$clean}", ['error' => $e->getMessage()]);
        }

        throw new \RuntimeException("Não foi possível consultar o CEP {$clean} no provedor fiscal nem no fallback.");
    }
}
