<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

readonly class FiscalStatusResult
{
    public function __construct(
        public string $status,
        public ?string $message = null,
        public ?string $xmlUrl = null,
        public ?string $pdfUrl = null
    ) {}
}
