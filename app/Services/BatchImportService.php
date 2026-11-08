<?php

namespace App\Services;

use App\Jobs\ProcessBatchRowJob;
use App\Models\InvoiceBatch;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class BatchImportService
{
    private const MAX_ROWS = 300;

    public function process(UploadedFile $file, string $companyId): array
    {
        $rows = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray {
            public function array(array $array) {}
        }, $file)[0] ?? [];

        if (count($rows) > self::MAX_ROWS + 1) { // +1 for header
            throw ValidationException::withMessages([
                'file' => 'O limite máximo por lote é de 300 linhas'
            ]);
        }
        
        if (count($rows) <= 1) {
            throw ValidationException::withMessages([
                'file' => 'O arquivo está vazio ou contém apenas cabeçalhos.'
            ]);
        }

        $header = array_shift($rows);
        $formattedRows = [];
        
        foreach ($rows as $row) {
            if (count($header) === count($row)) {
                $formattedRows[] = array_combine($header, $row);
            }
        }

        $batchRecord = InvoiceBatch::create([
            'company_id' => $companyId,
            'total_records' => count($formattedRows),
            'processed_records' => 0,
            'error_records' => 0,
            'status' => 'PENDING',
        ]);

        $jobs = [];
        foreach ($formattedRows as $row) {
            $jobs[] = new ProcessBatchRowJob($batchRecord->id, $companyId, $row);
        }

        $busBatch = Bus::batch($jobs)
            ->then(function ($batch) use ($batchRecord) {
                $batchRecord->update(['status' => 'COMPLETED']);
            })->catch(function ($batch, \Throwable $e) use ($batchRecord) {
                $batchRecord->update(['status' => 'FAILED']);
            })->finally(function ($batch) use ($batchRecord) {
                if ($batchRecord->status !== 'FAILED') {
                     $batchRecord->update(['status' => 'COMPLETED']);
                }
            })->dispatch();

        return [
            'batch_id' => $batchRecord->id,
            'bus_batch_id' => $busBatch->id,
            'message' => 'Lote criado e em processamento.'
        ];
    }
}
