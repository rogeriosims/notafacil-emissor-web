<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\Services;

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\DTOs\CsrfDetailDTO;
use App\Domain\Fiscal\DTOs\RetentionDetailDTO;
use App\Domain\Fiscal\DTOs\TaxCalculationResult;
use App\Domain\Fiscal\Exceptions\InvalidTaxRateException;

class TaxEngineService
{
    private const ADR005_LIMIT = 10.0;

    private const IRRF_RATE = 1.5;
    private const CSRF_PIS_RATE = 0.65;
    private const CSRF_COFINS_RATE = 3.0;
    private const CSRF_CSLL_RATE = 1.0;
    private const INSS_RATE = 11.0;

    public function calculate(CanonicalInvoiceDTO $dto): TaxCalculationResult
    {
        $this->validateIssRate($dto->issRate);

        $iss = $this->calculateIss($dto);

        $inss = $this->calculateInss($dto);
        $irrf = $this->calculateIrrf($dto);
        $csrf = $this->calculateCsrf($dto);

        $netValue = $dto->serviceValue - $iss->value - $inss->value - $irrf->value - $csrf->totalValue;

        return new TaxCalculationResult(
            $iss,
            $inss,
            $irrf,
            $csrf,
            round($netValue, 2, PHP_ROUND_HALF_UP)
        );
    }

    private function validateIssRate(float $rate): void
    {
        if ($rate < 2.0 || $rate > 5.0) {
            throw InvalidTaxRateException::outOfBounds($rate);
        }
    }

    private function calculateIss(CanonicalInvoiceDTO $dto): RetentionDetailDTO
    {
        $issValue = 0.0;
        $issRetained = false;

        if ($dto->allowRetention && $dto->opSimpNac !== 2) {
            $issRetained = $this->determineIssRetention($dto);
            if ($issRetained) {
                $issValue = round($dto->serviceValue * ($dto->issRate / 100), 2, PHP_ROUND_HALF_UP);
            }
        }

        return new RetentionDetailDTO($dto->issRate, $issValue, $issRetained);
    }

    private function determineIssRetention(CanonicalInvoiceDTO $dto): bool
    {
        if ($dto->issWithheldByTomador) {
            return true;
        }

        if ($dto->issDueAtExecution) {
            return true;
        }

        if ($dto->opSimpNac === 3 && $dto->snRetentionSubject) {
            return true;
        }

        return false;
    }

    private function shouldRetainFederals(CanonicalInvoiceDTO $dto): bool
    {
        if ($dto->isTomadorCpf) {
            return false;
        }

        if ($dto->opSimpNac === 2) { // MEI never retains federals
            return false;
        }

        return true;
    }

    private function calculateInss(CanonicalInvoiceDTO $dto): RetentionDetailDTO
    {
        if (!$this->shouldRetainFederals($dto)) {
            return new RetentionDetailDTO(self::INSS_RATE, 0.0, false);
        }

        // Only Simples Nacional (Anexo IV) with cessao de mao de obra or Normal Regime with cessao de mao de obra
        // Actually the rule says: "Simples Nacional no Anexo IV com cessão de mão de obra retém INSS"
        // Also Normal regime with cessao de mao de obra retains INSS.
        $retainsInss = false;

        if ($dto->opSimpNac === 3) {
            if ($dto->isAnexoIV && $dto->hasCessaoMaoDeObra) {
                $retainsInss = true;
            }
        } else {
            // Regra geral para não optante do simples - precisa ter cessão? Não há exigência explícita nos testes,
            // mas assumimos que o INSS retenha se $dto->hasCessaoMaoDeObra for true e for regime normal ou se for SN Anexo IV.
            if ($dto->hasCessaoMaoDeObra) {
                $retainsInss = true;
            }
        }

        if ($retainsInss) {
            $value = round($dto->serviceValue * (self::INSS_RATE / 100), 2, PHP_ROUND_HALF_UP);

            // INSS does not have ADR005 limit for IRRF/CSRF? ADR005 specifically mentions IRRF and CSRF.
            // Let's assume INSS doesn't have a 10.00 floor or has its own. Wait, ADR005: "Se o valor calculado de IRRF... da CSRF..."
            return new RetentionDetailDTO(self::INSS_RATE, $value, true, false);
        }

        return new RetentionDetailDTO(self::INSS_RATE, 0.0, false);
    }

    private function calculateIrrf(CanonicalInvoiceDTO $dto): RetentionDetailDTO
    {
        if (!$this->shouldRetainFederals($dto) || $dto->opSimpNac === 3) { // Simples doesn't retain IRRF
            return new RetentionDetailDTO(self::IRRF_RATE, 0.0, false);
        }

        $value = round($dto->serviceValue * (self::IRRF_RATE / 100), 2, PHP_ROUND_HALF_UP);

        if ($value <= self::ADR005_LIMIT) {
            return new RetentionDetailDTO(self::IRRF_RATE, 0.0, false, true);
        }

        return new RetentionDetailDTO(self::IRRF_RATE, $value, true, false);
    }

    private function calculateCsrf(CanonicalInvoiceDTO $dto): CsrfDetailDTO
    {
        $totalRate = self::CSRF_PIS_RATE + self::CSRF_COFINS_RATE + self::CSRF_CSLL_RATE;

        if (!$this->shouldRetainFederals($dto) || $dto->opSimpNac === 3) { // Simples doesn't retain CSRF
            return new CsrfDetailDTO($totalRate, 0.0, 0.0, 0.0, 0.0, false);
        }

        $totalValue = round($dto->serviceValue * ($totalRate / 100), 2, PHP_ROUND_HALF_UP);

        if ($totalValue <= self::ADR005_LIMIT) {
            return new CsrfDetailDTO($totalRate, 0.0, 0.0, 0.0, 0.0, false, true);
        }

        $pis = round($dto->serviceValue * (self::CSRF_PIS_RATE / 100), 2, PHP_ROUND_HALF_UP);
        $cofins = round($dto->serviceValue * (self::CSRF_COFINS_RATE / 100), 2, PHP_ROUND_HALF_UP);
        $csll = round($dto->serviceValue * (self::CSRF_CSLL_RATE / 100), 2, PHP_ROUND_HALF_UP);

        return new CsrfDetailDTO($totalRate, $totalValue, $pis, $cofins, $csll, true, false);
    }
}
