<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Enums\InvoiceStatus;
use Illuminate\Database\QueryException;

class Invoice extends Model
{
    use HasFactory, HasUuids, BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'company_id',
        'issuing_office_id',
        'customer_id',
        'batch_id',
        'schedule_id',
        'status',
        'number',
        'series',
        'dps_id',
        'issue_date',
        'competence_date',
        'service_amount',
        'deductions_amount',
        'net_amount',
        'borrower_snapshot',
        'iss_snapshot',
        'federal_taxes_snapshot',
        'xml_url',
        'pdf_url',
    ];

    protected $casts = [
        'status' => InvoiceStatus::class,
        'issue_date' => 'datetime',
        'competence_date' => 'date',
        'service_amount' => 'decimal:4',
        'deductions_amount' => 'decimal:4',
        'net_amount' => 'decimal:4',
        'borrower_snapshot' => 'json',
        'iss_snapshot' => 'json',
        'federal_taxes_snapshot' => 'json',
    ];

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($invoice) {
            if ($invoice->status === InvoiceStatus::AUTHORIZED) {
                throw new QueryException('', 'Cannot delete an authorized invoice.', [], new \Exception());
            }
        });
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function batch()
    {
        return $this->belongsTo(InvoiceBatch::class, 'batch_id');
    }

    public function schedule()
    {
        return $this->belongsTo(InvoiceSchedule::class, 'schedule_id');
    }
}
