<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Invoice;
use App\Enums\InvoiceStatus;
use App\Infrastructure\Fiscal\FiscalManager;
use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IssueInvoiceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly string $invoiceId
    ) {}

    public function handle(FiscalManager $fiscalManager): void
    {
        $invoice = Invoice::findOrFail($this->invoiceId);

        // Pre-retry reconciliation (LOGIC-002)
        if ($invoice->status === InvoiceStatus::PROCESSING && $invoice->tracking_id) {
            $driver = $fiscalManager->driver($invoice->company->fiscal_driver);
            $statusResult = $driver->checkStatus($invoice->tracking_id);

            if ($statusResult->status === 'AUTHORIZED') {
                $invoice->update(['status' => InvoiceStatus::AUTHORIZED->value]);
                return;
            }
            if ($statusResult->status === 'ERROR') {
                $invoice->update(['status' => InvoiceStatus::ERROR->value]);
                return;
            }
        }

        // Atomic state transition to PROCESSING
        $updated = DB::table('invoices')
            ->where('id', $this->invoiceId)
            ->whereIn('status', [InvoiceStatus::DRAFT->value, InvoiceStatus::ERROR->value])
            ->update(['status' => InvoiceStatus::PROCESSING->value]);

        if (!$updated && $invoice->status !== InvoiceStatus::PROCESSING) {
            Log::info("Skipping invoice {$this->invoiceId} as it is not in a valid state to issue.");
            return;
        }

        // We need the model updated with PROCESSING
        $invoice->refresh();

        $driver = $fiscalManager->driver($invoice->company->fiscal_driver);
        
        $dto = new CanonicalInvoiceDTO(
            serviceValue: (float) $invoice->service_amount,
            allowRetention: false, // Defaulting for now
            opSimpNac: 0,
            issWithheldByTomador: false,
            issDueAtExecution: false,
            snRetentionSubject: false,
            issRate: 0.0,
            isAnexoIV: false,
            hasCessaoMaoDeObra: false,
            isTomadorCpf: false
        );

        try {
            $result = $driver->issue($dto);
            
            $invoice->payloads()->create([
                'request_payload' => (array) $dto,
                'response_payload' => (array) $result,
                'http_status' => 200,
                'endpoint' => 'issue'
            ]);

            if ($result->status === 'PROCESSING') {
                $invoice->update([
                    'tracking_id' => $result->trackingId,
                ]);
                
                CheckInvoiceStatusJob::dispatch($this->invoiceId)
                    ->delay(now()->addSeconds(15));
                    
            } else {
                $invoice->update([
                    'status' => InvoiceStatus::from($result->status)->value,
                    'tracking_id' => $result->trackingId ?? $invoice->tracking_id,
                ]);
            }
            
        } catch (\Exception $e) {
            $invoice->payloads()->create([
                'request_payload' => (array) $dto,
                'response_payload' => ['error' => $e->getMessage()],
                'http_status' => 500,
                'endpoint' => 'issue'
            ]);
            
            // On timeout/error, assume processing and dispatch status check
            $invoice->update([
                'status' => InvoiceStatus::PROCESSING->value,
            ]);
            CheckInvoiceStatusJob::dispatch($this->invoiceId)
                ->delay(now()->addSeconds(15));
                
            throw $e;
        }
    }
}