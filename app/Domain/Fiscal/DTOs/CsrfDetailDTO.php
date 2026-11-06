<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

readonly class CsrfDetailDTO
{
    public function __construct(
        public float $totalRate,
        public float $totalValue,
        public float $pisValue,
        public float $cofinsValue,
        public float $csllValue,
        public bool $isRetained,
        public bool $dispensedByAdr005 = false
    ) {}
}
