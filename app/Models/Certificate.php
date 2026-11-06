<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Certificate extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'company_id',
        'pfx_encrypted',
        'password_encrypted',
        'expires_at',
        'issuer_info',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'pfx_encrypted' => 'encrypted',
        'password_encrypted' => 'encrypted',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
