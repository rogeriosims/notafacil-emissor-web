<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Traits\BelongsToTenant;

class Company extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'name',
        'office_id',
        'allow_client_certificate_upload',
    ];

    public function office()
    {
        return $this->belongsTo(Office::class);
    }
}
