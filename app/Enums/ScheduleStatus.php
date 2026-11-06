<?php
declare(strict_types=1);

namespace App\Enums;

enum ScheduleStatus: string
{
    case ACTIVE = 'ACTIVE';
    case PAUSED = 'PAUSED';
    case COMPLETED = 'COMPLETED';
    case CANCELED = 'CANCELED';
}
