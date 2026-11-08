<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InvoicePayload extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'invoice_id',
        'request_payload',
        'response_payload',
        'http_status',
        'endpoint',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_payload' => 'array',
        'http_status' => 'integer',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}