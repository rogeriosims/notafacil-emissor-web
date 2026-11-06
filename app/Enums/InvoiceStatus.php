<?php
declare(strict_types=1);

namespace App\Enums;

enum InvoiceStatus: string
{
    case DRAFT = 'DRAFT';
    case PROCESSING = 'PROCESSING';
    case AUTHORIZED = 'AUTHORIZED';
    case ERROR = 'ERROR';
    case CANCELED = 'CANCELED';
}
