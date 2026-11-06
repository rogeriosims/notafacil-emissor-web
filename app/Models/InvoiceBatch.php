<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Enums\BatchStatus;

class InvoiceBatch extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'total_records',
        'processed_records',
        'error_records',
        'status',
        'errors',
    ];

    protected $casts = [
        'status' => BatchStatus::class,
        'errors' => 'json',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'batch_id');
    }
}
