<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Invoice;
use App\Enums\InvoiceStatus;
use Illuminate\Support\Carbon;

class InvoiceCloningService
{
    public function clone(Invoice $invoice): Invoice
    {
        $cloned = $invoice->replicate();
        
        $cloned->status = InvoiceStatus::DRAFT;
        $cloned->number = null;
        $cloned->dps_id = null;
        $cloned->issue_date = Carbon::now();
        $cloned->competence_date = Carbon::now()->format('Y-m-d');
        
        $cloned->save();
        
        return $cloned;
    }
}
