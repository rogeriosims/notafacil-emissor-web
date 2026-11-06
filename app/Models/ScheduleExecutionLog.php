<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ScheduleExecutionLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'schedule_id',
        'invoice_id',
        'status',
        'details',
        'execution_date',
    ];

    protected $casts = [
        'execution_date' => 'datetime',
        'details' => 'json',
    ];

    public function schedule()
    {
        return $this->belongsTo(InvoiceSchedule::class, 'schedule_id');
    }
}
