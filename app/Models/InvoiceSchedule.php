<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Enums\ScheduleStatus;
use App\Enums\ScheduleType;

class InvoiceSchedule extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'template_invoice_id',
        'type',
        'day_of_month',
        'next_emission_date',
        'status',
        'description_template',
    ];

    protected $casts = [
        'status' => ScheduleStatus::class,
        'type' => ScheduleType::class,
        'next_emission_date' => 'date',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function templateInvoice()
    {
        return $this->belongsTo(Invoice::class, 'template_invoice_id');
    }

    public function executionLogs()
    {
        return $this->hasMany(ScheduleExecutionLog::class, 'schedule_id');
    }
}
