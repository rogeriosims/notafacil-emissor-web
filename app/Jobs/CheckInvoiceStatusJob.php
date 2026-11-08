<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Invoice;
use App\Enums\InvoiceStatus;
use App\Infrastructure\Fiscal\FiscalManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckInvoiceStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 10;
    
    public function __construct(
        public readonly string $invoiceId
    ) {}

    public function backoff(): array
    {
        return [15, 30, 60, 120, 300];
    }

    public function handle(FiscalManager $fiscalManager): void
    {
        $invoice = Invoice::findOrFail($this->invoiceId);

        if ($invoice->status !== InvoiceStatus::PROCESSING || !$invoice->tracking_id) {
            return; // Nothing to check
        }

        $driver = $fiscalManager->driver($invoice->company->fiscal_driver);
        $result = $driver->checkStatus($invoice->tracking_id);
        
        $invoice->payloads()->create([
            'request_payload' => ['tracking_id' => $invoice->tracking_id],
            'response_payload' => (array) $result,
            'http_status' => 200,
            'endpoint' => 'checkStatus'
        ]);

        if ($result->status === 'AUTHORIZED') {
            $invoice->update([
                'status' => InvoiceStatus::AUTHORIZED->value,
                'xml_url' => $result->xmlUrl,
                'pdf_url' => $result->pdfUrl,
            ]);
        } elseif ($result->status === 'ERROR') {
            $invoice->update([
                'status' => InvoiceStatus::ERROR->value,
            ]);
        } else {
            // Still processing, throw exception to trigger backoff/retry
            throw new \Exception('Invoice still processing');
        }
    }
}