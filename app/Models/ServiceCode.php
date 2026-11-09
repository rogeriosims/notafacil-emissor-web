<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCode extends Model
{
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'description',
        'min_rate',
        'max_rate',
    ];

    protected $casts = [
        'min_rate' => 'float',
        'max_rate' => 'float',
    ];
}
