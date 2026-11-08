<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\BatchDeletionBlockedException;
use App\Models\InvoiceBatch;
use App\Models\Invoice;
use App\Services\BatchImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Enums\InvoiceStatus;
use Illuminate\Support\Facades\DB;

class BatchController extends \Illuminate\Routing\Controller
{
    public function __construct(private BatchImportService $batchImportService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls'
        ]);

        $companyId = $request->header('X-Impersonate-Company-Id') ?? session('impersonate_company_id');

        if (!$companyId) {
            return response()->json(['message' => 'Tenant não informado.'], 400);
        }

        $result = $this->batchImportService->process($request->file('file'), $companyId);

        return response()->json($result, 202);
    }

    public function index(Request $request): JsonResponse
    {
        $companyId = $request->header('X-Impersonate-Company-Id');
        
        $batches = InvoiceBatch::where('company_id', $companyId)->latest()->paginate(15);
        
        return response()->json($batches);
    }

    public function show(string $id): JsonResponse
    {
        $batch = InvoiceBatch::findOrFail($id);
        
        return response()->json($batch);
    }

    public function destroy(string $id): JsonResponse
    {
        $batch = InvoiceBatch::findOrFail($id);
        
        $hasAuthorized = Invoice::where('batch_id', $id)
            ->where('status', InvoiceStatus::AUTHORIZED->value)
            ->exists();
            
        if ($hasAuthorized) {
            throw new BatchDeletionBlockedException();
        }

        DB::transaction(function () use ($batch, $id) {
            Invoice::where('batch_id', $id)->delete();
            $batch->delete();
        });

        return response()->json(['message' => 'Lote excluído com sucesso.']);
    }
}
