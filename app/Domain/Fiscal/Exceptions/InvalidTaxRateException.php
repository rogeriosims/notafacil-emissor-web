<?php

declare(strict_types=1);

namespace App\Domain\Fiscal\Exceptions;

use Exception;

class InvalidTaxRateException extends Exception
{
    public static function outOfBounds(float $rate): self
    {
        return new self(sprintf('A alíquota informada (%.2f%%) está fora dos limites permitidos (2%% a 5%%).', $rate));
    }
}
