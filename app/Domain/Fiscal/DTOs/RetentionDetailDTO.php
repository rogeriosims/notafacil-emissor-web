<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

readonly class RetentionDetailDTO
{
    public function __construct(
        public float $rate,
        public float $value,
        public bool $isRetained,
        public bool $dispensedByAdr005 = false
    ) {}
}
