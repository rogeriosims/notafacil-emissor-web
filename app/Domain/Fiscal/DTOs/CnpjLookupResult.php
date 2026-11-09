<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

final readonly class CnpjLookupResult
{
    /**
     * @param string $cnpj
     * @param string $companyName
     * @param string|null $tradeName
     * @param string $status
     * @param array{
     *     street: string,
     *     number: string,
     *     complement?: string,
     *     neighborhood: string,
     *     city: string,
     *     state: string,
     *     zipCode: string,
     *     ibgeCode: string
     * } $address
     * @param string|null $taxStatus
     * @param string|null $cnae
     * @param string $source
     */
    public function __construct(
        public string $cnpj,
        public string $companyName,
        public ?string $tradeName,
        public string $status,
        public array $address,
        public ?string $taxStatus = null,
        public ?string $cnae = null,
        public string $source = 'ACBR'
    ) {}

    public function toArray(): array
    {
        return [
            'cnpj' => $this->cnpj,
            'name' => $this->companyName,
            'companyName' => $this->companyName,
            'tradeName' => $this->tradeName ?? $this->companyName,
            'status' => $this->status,
            'address' => $this->address,
            'taxStatus' => $this->taxStatus,
            'cnae' => $this->cnae,
            'source' => $this->source,
        ];
    }
}
