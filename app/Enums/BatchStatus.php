<?php
declare(strict_types=1);

namespace App\Enums;

enum BatchStatus: string
{
    case PENDING = 'PENDING';
    case PROCESSING = 'PROCESSING';
    case COMPLETED = 'COMPLETED';
    case FAILED = 'FAILED';
}
