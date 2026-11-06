<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\DTOs;

readonly class CanonicalInvoiceDTO
{
    public function __construct(
        public float $serviceValue,
        public bool $allowRetention,
        public int $opSimpNac,
        public bool $issWithheldByTomador,
        public bool $issDueAtExecution,
        public bool $snRetentionSubject,
        public float $issRate,
        public bool $isAnexoIV,
        public bool $hasCessaoMaoDeObra,
        public bool $isTomadorCpf
    ) {}
}
