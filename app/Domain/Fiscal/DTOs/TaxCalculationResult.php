<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

readonly class TaxCalculationResult
{
    public function __construct(
        public RetentionDetailDTO $iss,
        public RetentionDetailDTO $inss,
        public RetentionDetailDTO $irrf,
        public CsrfDetailDTO $csrf,
        public float $netValue
    ) {}
}
