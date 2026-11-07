<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

readonly class FiscalCancelResult
{
    public function __construct(
        public string $status,
        public ?string $message = null
    ) {}
}
