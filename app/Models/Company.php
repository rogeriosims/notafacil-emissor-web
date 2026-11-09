<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'office_id',
        'name',
        'trade_name',
        'cnpj',
        'email',
        'phone',
        'municipal_registration',
        'city_code',
        'state',
        'city',
        'zip_code',
        'street',
        'number',
        'complement',
        'neighborhood',
        'op_simples_nacional',
        'apuracao_sn',
        'regime_especial_tributacao',
        'incentivo_fiscal',
        'city_hall_login',
        'city_hall_password',
        'rps_last_lote',
        'rps_series',
        'rps_last_number',
        'fiscal_driver',
        'allow_client_certificate_upload',
    ];

    protected $casts = [
        'allow_client_certificate_upload' => 'boolean',
        'incentivo_fiscal' => 'boolean',
        'op_simples_nacional' => 'integer',
        'apuracao_sn' => 'integer',
        'regime_especial_tributacao' => 'integer',
        'rps_last_lote' => 'integer',
        'rps_last_number' => 'integer',
    ];

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function serviceItems(): HasMany
    {
        return $this->hasMany(ServiceItem::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
