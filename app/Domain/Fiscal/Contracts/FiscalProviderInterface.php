<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\Contracts;

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\DTOs\FiscalIssueResult;
use App\Domain\Fiscal\DTOs\FiscalStatusResult;
use App\Domain\Fiscal\DTOs\FiscalCancelResult;
use App\Domain\Fiscal\DTOs\CnpjLookupResult;
use App\Domain\Fiscal\DTOs\CepLookupResult;

interface FiscalProviderInterface
{
    /**
     * @param CanonicalInvoiceDTO $dto
     * @return FiscalIssueResult
     */
    public function issue(CanonicalInvoiceDTO $dto): FiscalIssueResult;

    /**
     * @param string $trackingId
     * @return FiscalStatusResult
     */
    public function checkStatus(string $trackingId): FiscalStatusResult;

    /**
     * @param string $trackingId
     * @param string $reason
     * @return FiscalCancelResult
     */
    public function cancel(string $trackingId, string $reason): FiscalCancelResult;

    /**
     * @param string $trackingId
     * @return string|null
     */
    public function downloadXml(string $trackingId): ?string;

    /**
     * @param string $trackingId
     * @return string|null
     */
    public function downloadPdf(string $trackingId): ?string;

    /**
     * @param string $base64Cert
     * @param string $password
     * @return bool
     */
    public function syncCertificate(string $base64Cert, string $password): bool;

    /**
     * Consulta agnóstica de dados cadastrais por CNPJ.
     *
     * @param string $cnpj
     * @return CnpjLookupResult
     */
    public function lookupCnpj(string $cnpj): CnpjLookupResult;

    /**
     * Consulta agnóstica de endereço e código IBGE por CEP.
     *
     * @param string $cep
     * @return CepLookupResult
     */
    public function lookupCep(string $cep): CepLookupResult;
}
