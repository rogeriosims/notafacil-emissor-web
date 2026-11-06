<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Customer extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'name',
        'tax_id',
        'email',
        'phone',
        'street',
        'number',
        'neighborhood',
        'city_code',
        'state',
        'zip_code',
        'iss_withheld',
    ];

    protected $casts = [
        'iss_withheld' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
