<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ServiceItem extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'service_code',
        'cnae_code',
        'description',
        'default_rate',
        'allow_retention',
    ];

    protected $casts = [
        'default_rate' => 'decimal:4',
        'allow_retention' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
