<?php
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Office extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
    ];

    public function companies()
    {
        return $this->hasMany(Company::class);
    }
}
