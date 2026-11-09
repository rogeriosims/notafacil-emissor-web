<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

final readonly class CepLookupResult
{
    /**
     * @param string $cep
     * @param string $street
     * @param string $neighborhood
     * @param string $city
     * @param string $state
     * @param string $ibgeCode
     * @param string $source
     */
    public function __construct(
        public string $cep,
        public string $street,
        public string $neighborhood,
        public string $city,
        public string $state,
        public string $ibgeCode,
        public string $source = 'ACBR'
    ) {}

    public function toArray(): array
    {
        return [
            'cep' => $this->cep,
            'street' => $this->street,
            'neighborhood' => $this->neighborhood,
            'city' => $this->city,
            'state' => $this->state,
            'ibge' => $this->ibgeCode,
            'ibgeCode' => $this->ibgeCode,
            'source' => $this->source,
        ];
    }
}
