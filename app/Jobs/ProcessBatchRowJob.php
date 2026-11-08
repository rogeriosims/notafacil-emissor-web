<?php

namespace App\Jobs;

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\Services\TaxEngineService;
use App\Enums\InvoiceStatus;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceBatch;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProcessBatchRowJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public function __construct(
        public string $invoiceBatchId,
        public string $companyId,
        public array $row
    ) {}

    public function handle(TaxEngineService $taxEngine): void
    {
        if ($this->batch() && $this->batch()->cancelled()) {
            return;
        }

        try {
            app(\App\Services\ImpersonationManager::class)->impersonate($this->companyId);
            DB::transaction(function () use ($taxEngine) {
                // 1. Resolve Customer
                $customer = \App\Models\Customer::withoutGlobalScopes()->firstOrCreate(
                    [
                        'tax_id' => $this->row['document'],
                        'company_id' => $this->companyId,
                    ],
                    [
                        'name' => $this->row['name'],
                        'email' => $this->row['email'] ?? null,
                    ]
                );

                // 2. Prepare DTO
                $serviceValue = (float) $this->row['service_value'];
                $issRate = (float) $this->row['iss_rate'];
                $isSimples = (bool) ($this->row['is_simples_nacional'] ?? false);
                
                $dto = new CanonicalInvoiceDTO(
                    serviceValue: $serviceValue,
                    allowRetention: true,
                    opSimpNac: $isSimples ? 3 : 1, // Assume 3 for Simples, 1 for Normal
                    issWithheldByTomador: false,
                    issDueAtExecution: false,
                    snRetentionSubject: false,
                    issRate: $issRate,
                    isAnexoIV: false,
                    hasCessaoMaoDeObra: false,
                    isTomadorCpf: strlen(preg_replace('/[^0-9]/', '', $this->row['document'])) === 11
                );

                // 3. Calculate taxes
                $taxResult = $taxEngine->calculate($dto);

                // 4. Create Invoice Draft
                Invoice::withoutGlobalScopes()->create([
                    'company_id' => $this->companyId,
                    'batch_id' => $this->invoiceBatchId,
                    'customer_id' => $customer->id,
                    'status' => InvoiceStatus::DRAFT->value,
                    'service_amount' => $serviceValue,
                    'net_amount' => $taxResult->netValue,
                    'iss_snapshot' => [
                        'rate' => $taxResult->iss->rate,
                        'value' => $taxResult->iss->value,
                        'retained' => $taxResult->iss->isRetained, // Fixed here
                    ],
                    'federal_taxes_snapshot' => [
                        'irrf' => $taxResult->irrf->value,
                        'inss' => $taxResult->inss->value,
                        'pis' => $taxResult->csrf->pisValue,
                        'cofins' => $taxResult->csrf->cofinsValue,
                        'csll' => $taxResult->csrf->csllValue,
                    ]
                ]);

                // 5. Update Batch Progress
                InvoiceBatch::withoutGlobalScopes()->where('id', $this->invoiceBatchId)->increment('processed_records');
            });
        } catch (Throwable $e) {
            DB::transaction(function () use ($e) {
                $batch = InvoiceBatch::withoutGlobalScopes()->find($this->invoiceBatchId);
                $errors = $batch->errors ?? [];
                $errors[] = [
                    'document' => $this->row['document'],
                    'error' => $e->getMessage()
                ];
                
                $batch->errors = $errors;
                $batch->error_records += 1;
                $batch->save();
            });
        }
    }
}
